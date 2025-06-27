// src/features/teams/services/bulkImportService.ts
import { parse } from 'csv-parse/sync';
import User from '../../../shared/models/User';
import { Team } from '../../../shared/models/Team';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../../shared/errors/AppError';
import * as teamService from './teamService';
import { Types } from 'mongoose';

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  role: string;
}

interface ResultItem {
  email: string;
  message: string;
}

interface ErrorItem {
  email: string;
  error: string;
}

interface Results {
  success: Array<ResultItem>;
  failure: Array<ErrorItem>;
}

interface BulkImportResult {
  total: number;
  successful: number;
  failed: number;
  results: Results;
}

export const bulkImportTeamMembers = async (
  teamId: string,
  csvContent: string,
  requesterId: string
): Promise<BulkImportResult> => {
  // Validate team existence and ownership
  const team = await validateTeamAccess(teamId, requesterId);
  
  try {
    // Parse and validate CSV content
    const records = parseAndValidateCsv(csvContent);
    
    // Process each record
    const results = await processRecords(records, team, teamId, requesterId);
    
    return {
      total: records.length,
      successful: results.success.length,
      failed: results.failure.length,
      results,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(`Error processing CSV: ${error.message}`);
    }
    throw error;
  }
};

// Helper function to validate team access
async function validateTeamAccess(teamId: string, requesterId: string) {
  const team = await Team.findById(teamId);
  
  if (!team) {
    throw new NotFoundError('Team not found');
  }
  
  if (team.owner.toString() !== requesterId) {
    throw new UnauthorizedError('Only the team owner can import members');
  }
  
  return team;
}

// Helper function to parse and validate CSV
function parseAndValidateCsv(csvContent: string) {
  // Parse CSV content
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  if (!records?.length) {
    throw new ValidationError('CSV file is empty or invalid');
  }
  
  // Validate required columns
  validateRequiredColumns(records[0]);
  
  return records;
}

// Helper function to validate required columns
function validateRequiredColumns(record: Record<string, any>) {
  const requiredColumns = ['Email', 'FirstName', 'LastName'];
  const csvColumns = Object.keys(record);
  
  const missingColumns = requiredColumns.filter(col => 
    !csvColumns.find(csvCol => csvCol.toLowerCase() === col.toLowerCase())
  );
  
  if (missingColumns.length > 0) {
    throw new ValidationError(`Missing required columns: ${missingColumns.join(', ')}`);
  }
}

// Helper function to process all records
async function processRecords(
  records: Record<string, any>[],
  team: any,
  teamId: string,
  requesterId: string
): Promise<Results> {
  const results: Results = {
    success: [],
    failure: [],
  };
  
  // Process in batches for existing users
  const userData: UserData[] = [];
  const emailsToProcess: string[] = [];
  
  // Extract user data and collect emails
  for (const record of records) {
    try {
      const extractedData = extractUserData(record);
      
      if (!isUserDataValid(extractedData)) {
        results.failure.push({
          email: extractedData.email || 'unknown',
          error: 'Missing required fields (email, first name, or last name)',
        });
        continue;
      }
      
      userData.push(extractedData);
      emailsToProcess.push(extractedData.email.toLowerCase());
    } catch (extractError) {
      const email = getEmailFromRecord(record) ?? 'unknown';
      results.failure.push({
        email,
        error: extractError instanceof Error ? extractError.message : 'Failed to extract user data',
      });
    }
  }
  
  if (emailsToProcess.length === 0) {
    return results;
  }
  
  // Find existing users
  const existingUsers = await User.find({ email: { $in: emailsToProcess } });
  const emailToUserMap = new Map(
    existingUsers.map(user => [user.email.toLowerCase(), user])
  );
  
  // Process existing users
  const userIdsToAdd: string[] = [];
  const emailsToInvite: string[] = [];
  
  // Identify users to add or invite
  for (const data of userData) {
    const email = data.email.toLowerCase();
    const existingUser = emailToUserMap.get(email);
    
    if (existingUser) {
      // Check if already in team
      const isMember = team.members.some((m: any) => m.toString() === existingUser._id.toString());
      
      if (isMember) {
        results.failure.push({
          email,
          error: 'User is already a team member',
        });
      } else {
        userIdsToAdd.push(existingUser._id.toString());
      }
    } else {
      // Mark for invitation
      emailsToInvite.push(email);
    }
  }
  
  // Add existing users to team
  if (userIdsToAdd.length > 0) {
    try {
      const addResult = await teamService.addTeamMembers(teamId, userIdsToAdd, requesterId);
      
      // Process add results
      for (const success of addResult.results.success) {
        const user = existingUsers.find(u => u._id.toString() === success.userId);
        if (user) {
          results.success.push({
            email: user.email,
            message: 'User added to team successfully',
          });
        }
      }
      
      for (const failure of addResult.results.failure) {
        const user = existingUsers.find(u => u._id.toString() === failure.userId);
        if (user) {
          results.failure.push({
            email: user.email,
            error: failure.error,
          });
        }
      }
    } catch (error) {
      // Handle bulk add error
      for (const userId of userIdsToAdd) {
        const user = existingUsers.find(u => u._id.toString() === userId);
        if (user) {
          results.failure.push({
            email: user.email,
            error: error instanceof Error ? error.message : 'Failed to add user to team',
          });
        }
      }
    }
  }
  
  // Send invitations to non-existing users
  if (emailsToInvite.length > 0) {
    try {
      const inviteResult = await teamService.inviteToTeam(teamId, emailsToInvite, requesterId);
      
      // Process invite results
      for (const success of inviteResult.results.success) {
        results.success.push({
          email: success.email,
          message: 'Invitation sent successfully',
        });
      }
      
      for (const failure of inviteResult.results.failure) {
        results.failure.push({
          email: failure.email,
          error: failure.error,
        });
      }
    } catch (error) {
      // Handle bulk invite error
      for (const email of emailsToInvite) {
        results.failure.push({
          email,
          error: error instanceof Error ? error.message : 'Failed to send invitation',
        });
      }
    }
  }
  
  return results;
}

// Helper function to extract user data from record
function extractUserData(record: Record<string, any>): UserData {
  const emailCol = findColumnName(record, 'Email');
  const firstNameCol = findColumnName(record, 'FirstName');
  const lastNameCol = findColumnName(record, 'LastName');
  
  if (!emailCol || !firstNameCol || !lastNameCol) {
    throw new Error('Missing required column');
  }
  
  const email = record[emailCol];
  const firstName = record[firstNameCol];
  const lastName = record[lastNameCol];
  
  // Additional columns
  const departmentCol = findColumnName(record, 'Department');
  const positionCol = findColumnName(record, 'Position');
  const roleCol = findColumnName(record, 'Role');
  
  const department = departmentCol ? record[departmentCol] : '';
  const position = positionCol ? record[positionCol] : '';
  const role = roleCol ? record[roleCol] : 'employee';
  
  return { email, firstName, lastName, department, position, role };
}

// Helper function to get email from record (for error reporting)
function getEmailFromRecord(record: Record<string, any>): string | null {
  const emailCol = findColumnName(record, 'Email');
  return emailCol ? record[emailCol] : null;
}

// Helper function to validate user data
function isUserDataValid(userData: UserData): boolean {
  return !!(userData.email && userData.firstName && userData.lastName);
}

// Helper to find column name case-insensitively
function findColumnName(record: Record<string, any>, columnName: string): string | undefined {
  const columns = Object.keys(record);
  return columns.find(col => col.toLowerCase() === columnName.toLowerCase());
}

// Generate a template CSV for user import
export const generateImportTemplate = (): string => {
  return 'Email,FirstName,LastName,Department,Position,Role\n';
};