// src/features/evaluation/services/reportGenerationService.ts
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { IEvaluationProgress } from '../../../shared/models/EvaluationProgress';
import { ReportGenerationError } from '../../../shared/errors/EvaluationErrors';
import config from '../../../shared/config';
import { IEvaluation } from '../../../shared/models/Evaluation';

/**
 * Generate a PDF evaluation report for a specific assignee
 */
export const generateEvaluationReport = async (
  evaluationProgress: IEvaluationProgress,
  evaluation: IEvaluation,
  userData: any,
  agentData: any
): Promise<Buffer> => {
  try {
    // Create unique filename for this report
    const reportId = uuidv4();
    const tempDir = config.pdf.tempDir;
    const htmlPath = path.join(tempDir, `${reportId}.html`);
    const pdfPath = path.join(tempDir, `${reportId}.pdf`);
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Prepare data for the report template
    const reportData = {
      title: evaluation.title,
      date: new Date().toLocaleDateString(),
      reportId,
      user: userData,
      agent: agentData,
      description: evaluation.description ?? '',
      overallScore: evaluationProgress.overallScore ?? 0,
      skillAssessments: evaluationProgress.skillAssessments ?? [],
      strengths: evaluationProgress.strengths ?? [],
      improvementAreas: evaluationProgress.improvementAreas ?? [],
      recommendation: evaluationProgress.recommendation ?? '',
      nextSteps: evaluationProgress.nextSteps ?? [],
    //   logoPath: config.pdf.logoPath,
    };
    
    // Generate HTML using a template
    const html = await generateReportHtml(reportData);
    
    // Write HTML to temporary file
    fs.writeFileSync(htmlPath, html);
    
    // Convert HTML to PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    
    // Add custom styles for PDF
    await page.addStyleTag({
      content: `
        @page {
          size: A4;
          margin: 20mm 15mm;
        }
        body {
          font-family: 'Arial', sans-serif;
        }
      `
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 8px; width: 100%; text-align: right; padding-right: 20px;">Evaluation Report</div>',
      footerTemplate: '<div style="font-size: 8px; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      margin: {
        top: '30px',
        right: '20px',
        bottom: '30px',
        left: '20px',
      }
    });
    
    await browser.close();
    
    // Clean up temporary files
    if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    throw new ReportGenerationError(`Failed to generate PDF report: ${(error as Error).message}`);
  }
};

/**
 * Generate HTML for the evaluation report using a Handlebars template
 */
async function generateReportHtml(data: any): Promise<string> {
  try {
    // Basic HTML template with styling
    const template = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Evaluation Report</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
          }
          .logo {
            max-width: 200px;
            margin-bottom: 20px;
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 10px;
          }
          h2 {
            color: #3498db;
            margin-top: 30px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .section {
            margin-bottom: 30px;
          }
          .meta {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .meta p {
            margin: 5px 0;
          }
          .score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: #f9f9f9;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
            margin: 0 auto;
            color: #fff;
            position: relative;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .skill-bar {
            height: 25px;
            background-color: #f1f1f1;
            border-radius: 4px;
            margin-bottom: 15px;
            overflow: hidden;
          }
          .skill-fill {
            height: 100%;
            background-color: #4CAF50;
            display: flex;
            align-items: center;
            padding-left: 10px;
            color: white;
          }
          .skill-name {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .point-list {
            list-style-type: none;
            padding-left: 0;
          }
          .point-list li {
            position: relative;
            padding-left: 30px;
            margin-bottom: 10px;
          }
          .strength-point::before {
            content: "✓";
            color: #4CAF50;
            position: absolute;
            left: 0;
            font-weight: bold;
          }
          .improvement-point::before {
            content: "!";
            color: #e74c3c;
            position: absolute;
            left: 0;
            font-weight: bold;
            background: #ffecec;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            text-align: center;
            line-height: 16px;
            font-size: 12px;
          }
          .next-step {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 15px;
          }
          .next-step h4 {
            margin-top: 0;
            color: #2c3e50;
          }
          .next-step-type {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            background-color: #3498db;
            color: white;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          {{#if logoPath}}
            <img src="{{logoPath}}" alt="Company Logo" class="logo">
          {{/if}}
          <h1>Evaluation Report</h1>
          <p>{{title}}</p>
        </div>
        
        <div class="meta">
          <p><strong>Team Member:</strong> {{user.firstName}} {{user.lastName}}</p>
          <p><strong>Position:</strong> {{user.position}}</p>
          <p><strong>Department:</strong> {{user.department}}</p>
          <p><strong>Date:</strong> {{date}}</p>
          <p><strong>Evaluator:</strong> {{agent.name}}</p>
          {{#if description}}
            <p><strong>Description:</strong> {{description}}</p>
          {{/if}}
        </div>
        
        <div class="section">
          <h2>Overall Assessment</h2>
          
          <div class="score-circle" style="background: {{scoreColor overallScore}}">
            {{overallScore}}%
          </div>
          <p style="text-align: center; margin-top: 15px;">
            {{overallAssessment overallScore}}
          </p>
        </div>
        
        <div class="section">
          <h2>Skill Assessment</h2>
          
          {{#each skillAssessments}}
            <div>
              <div class="skill-name">{{this.skillName}} (Weight: {{this.weight}})</div>
              <div class="skill-bar">
                <div class="skill-fill" style="width: {{this.score}}%; background-color: {{../scoreColor this.score}}">
                  {{this.score}}%
                </div>
              </div>
            </div>
          {{/each}}
        </div>
        
        <div class="section">
          <h2>Key Strengths</h2>
          
          <ul class="point-list">
            {{#each strengths}}
              <li class="strength-point">{{this}}</li>
            {{/each}}
          </ul>
        </div>
        
        <div class="section">
          <h2>Areas for Improvement</h2>
          
          <ul class="point-list">
            {{#each improvementAreas}}
              <li class="improvement-point">{{this}}</li>
            {{/each}}
          </ul>
        </div>
        
        {{#if recommendation}}
          <div class="section">
            <h2>Recommendation</h2>
            <p>{{recommendation}}</p>
          </div>
        {{/if}}
        
        {{#if nextSteps}}
          <div class="section">
            <h2>Next Steps</h2>
            
            {{#each nextSteps}}
              <div class="next-step">
                <span class="next-step-type">{{this.type}}</span>
                <h4>{{this.title}}</h4>
                <p>{{this.description}}</p>
              </div>
            {{/each}}
          </div>
        {{/if}}
        
        <div style="text-align: center; margin-top: 40px; color: #888; font-size: 12px;">
          <p>Report ID: {{reportId}}</p>
          <p>Generated by DigitalAgents.io</p>
        </div>
      </body>
      </html>
    `;
    
    // Register handlebars helpers
    Handlebars.registerHelper('scoreColor', function(score) {
      if (score >= 90) return '#4CAF50'; // Green
      if (score >= 75) return '#8BC34A'; // Light green
      if (score >= 60) return '#FFC107'; // Amber
      if (score >= 40) return '#FF9800'; // Orange
      return '#F44336'; // Red
    });
    
    Handlebars.registerHelper('overallAssessment', function(score) {
      if (score >= 90) return 'Exceptional performance demonstrating mastery of required skills.';
      if (score >= 75) return 'Strong performance exceeding expectations in most areas.';
      if (score >= 60) return 'Satisfactory performance meeting core expectations.';
      if (score >= 40) return 'Developing performance with several areas needing improvement.';
      return 'Performance requiring significant improvement across multiple areas.';
    });
    
    // Compile and render the template
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(data);
  } catch (error) {
    throw new ReportGenerationError(`Failed to generate report HTML: ${(error as Error).message}`);
  }
}