import axios from "axios";

interface ClickUpConfig {
  apiKey: string;
  listId: string;
}

interface ClickUpTask {
  id: string;
  name: string;
  text_content: string;
  status: {
    status: string;
    type: string;
  };
  custom_fields: Array<{
    id: string;
    name: string;
    type_config: any;
    value: any;
  }>;
  date_created: string;
  creator: {
    username: string;
    email: string;
  };
}

interface ClickUpResponse {
  tasks: ClickUpTask[];
}

export class ClickUpService {
  private readonly config: ClickUpConfig;
  private readonly baseUrl = "https://api.clickup.com/api/v2";

  constructor(config: ClickUpConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      Authorization: this.config.apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    };
  }

  private safeStringify(obj: any, indent = 2) {
    const seen = new WeakSet();
    return JSON.stringify(
      obj,
      function (key, value) {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }
        return value;
      },
      indent,
    );
  }

  async getTasks(): Promise<ClickUpTask[]> {
    try {
      const response = await axios.get<ClickUpResponse>(
        `${this.baseUrl}/list/${this.config.listId}/task?include_closed=true`,
        {
          headers: this.getHeaders(),
        },
      );
      console.log("tasks length: " + response.data.tasks.length);
      return response.data.tasks;
    } catch (error) {
      console.error("Error fetching tasks from ClickUp:", error);
      throw error;
    }
  }

  async getTaskDetails() {
    const clickupTasks = await this.getTasks();
    // console.log("tasks: " + this.safeStringify(tasks));

    const tasks = clickupTasks.map((task) => {
      const customTypeField = task.custom_fields.find(
        (field) => field.name === "Ticket Type",
      );
      const type = customTypeField
        ? customTypeField.type_config.options[
            customTypeField.type_config.options.length - 1
          ].name
        : "Unknown";
      return {
        _id: task.id,
        type: type,
        content: task.name,
        user: {
          firstName: task.creator.username.split(" ")[0],
          lastName: task.creator.username.split(" ").slice(1).join(" "),
          email: task.creator.email,
        },
        createdAt: task.date_created,
        status: task.status.status,
      };
    });

    return {
      tasks,
      stats: {
        open: clickupTasks.filter(
          (task) => task.status.type.toLowerCase() !== "closed",
        ).length,
        closed: clickupTasks.filter(
          (task) => task.status.type.toLowerCase() === "closed",
        ).length,
        total: clickupTasks.length,
      },
    };
  }
}
