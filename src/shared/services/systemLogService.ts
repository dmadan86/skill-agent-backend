import { SystemLog, ISystemLog } from "../models/SystemLog";

export class SystemLogService {
  static async logSystemStatus(
    status: "up" | "down",
    source: string,
    details?: Record<string, any>,
  ) {
    const log = new SystemLog({
      level: status === "up" ? "info" : "error",
      type: "system_status",
      message: `System ${status}`,
      status,
      source,
      details,
      timestamp: new Date(),
    });
    return await log.save();
  }

  static async logError(
    error: Error,
    source: string,
    details?: Record<string, any>,
  ) {
    const log = new SystemLog({
      level: "error",
      type: "error",
      message: error.message,
      source,
      details: {
        ...details,
        stack: error.stack,
      },
      timestamp: new Date(),
    });
    return await log.save();
  }

  static async logPerformance(
    metric: string,
    value: number,
    source: string,
    details?: Record<string, any>,
  ) {
    const log = new SystemLog({
      level: "info",
      type: "performance",
      message: `Performance metric: ${metric}`,
      source,
      details: {
        ...details,
        metric,
        value,
      },
      timestamp: new Date(),
    });
    return await log.save();
  }

  static async logSecurity(
    event: string,
    source: string,
    details?: Record<string, any>,
  ) {
    const log = new SystemLog({
      level: "warning",
      type: "security",
      message: `Security event: ${event}`,
      source,
      details,
      timestamp: new Date(),
    });
    return await log.save();
  }

  static async getSystemMetrics(startDate: Date, endDate: Date) {
    const logs = await SystemLog.find({
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const errorLogs = logs.filter((log) => log.level === "error");
    const crashCount = errorLogs.filter(
      (log) => log.type === "system_status",
    ).length;

    // Calculate uptime percentage
    const totalLogs = logs.length;
    const errorCount = errorLogs.length;
    const uptimePercentage =
      totalLogs > 0 ? ((totalLogs - errorCount) / totalLogs) * 100 : 100;

    return {
      uptime: {
        percentage: uptimePercentage,
        lastChecked: new Date(),
      },
      errorLogs: {
        total: errorCount,
        byType: this.groupErrorsByType(errorLogs),
      },
      crashCount,
    };
  }

  private static groupErrorsByType(logs: ISystemLog[]) {
    return logs.reduce(
      (acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
