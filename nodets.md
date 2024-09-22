node version

```js
import http from "http";
import { EventEmitter } from "events";
import fs from "fs";
import { parse } from "url";

const eventEmitter = new EventEmitter();
const DATA_FILE = "data.json";

// Helper function to check if the data file exists or not
const ensureDataFileExists = async () => {
  try {
    await fs.promises.access(DATA_FILE, fs.constants.F_OK);
  } catch (error) {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify([]));
  }
};

// Reads data from the file
const readDataFromFile = async () => {
  try {
    await ensureDataFileExists();
    const data = await fs.promises.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading data file: ", error);
    return [];
  }
};

// Writes data to the file
const writeDataToFile = async (data) => {
  try {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing data file: ", error);
  }
};

// Helper function to get the request body
const getRequestBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
    req.on("error", (err) => reject(err));
  });
};

// Event handling for save, update, delete
eventEmitter.on("saveData", async (newData) => {
  try {
    const data = await readDataFromFile();
    data.push(newData);
    await writeDataToFile(data);
  } catch (error) {
    console.error("Error saving data: ", error);
  }
});

eventEmitter.on("updateData", async (updatedData) => {
  try {
    const data = await readDataFromFile();
    const index = data.findIndex((item) => item.id === updatedData.id);
    if (index !== -1) {
      data[index] = updatedData;
      await writeDataToFile(data);
    }
  } catch (error) {
    console.error("Error updating data: ", error);
  }
});

eventEmitter.on("deleteData", async (id) => {
  try {
    let data = await readDataFromFile();
    data = data.filter((item) => item.id !== id);
    await writeDataToFile(data);
  } catch (error) {
    console.error("Error deleting data: ", error);
  }
});

// Create server and handle different routes
const server = http.createServer(async (req, res) => {
  try {
    const url = parse(req.url || "", true);
    const id = parseInt(url.pathname?.split("/")[2] || "0", 10);

    // POST /data – Add a new item
    if (req.method === "POST" && url.pathname === "/data") {
      const body = await getRequestBody(req);
      const newData = { ...JSON.parse(body), id: Date.now() };
      eventEmitter.emit("saveData", newData);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Data Saved", data: newData }));
    }

    // POST /data/multiple – Add multiple items at once
    else if (req.method === "POST" && url.pathname === "/data/multiple") {
      const body = await getRequestBody(req);
      const newItems = JSON.parse(body).map((item) => ({
        ...item,
        id: Date.now() + Math.random(),
      }));
      newItems.forEach((item) => eventEmitter.emit("saveData", item));
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: "Multiple Data Saved", data: newItems })
      );
    }

    // PUT /data/:id – Update an item by ID
    else if (req.method === "PUT" && url.pathname.startsWith("/data/")) {
      const body = await getRequestBody(req);
      const updatedData = { ...JSON.parse(body), id };
      eventEmitter.emit("updateData", updatedData);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Data updated", data: updatedData }));
    }

    // PATCH /data/:id – Partially update an item by ID
    else if (req.method === "PATCH" && url.pathname.startsWith("/data/")) {
      const body = await getRequestBody(req);
      const data = await readDataFromFile();
      const index = data.findIndex((item) => item.id === id);
      if (index !== -1) {
        data[index] = { ...data[index], ...JSON.parse(body) };
        await writeDataToFile(data);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Data partially updated",
            data: data[index],
          })
        );
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Data not found" }));
      }
    }

    // GET /data/:id – Retrieve a single item by ID
    else if (req.method === "GET" && url.pathname.startsWith("/data/")) {
      const data = await readDataFromFile();
      const item = data.find((d) => d.id === id);
      if (item) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(item));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Data not found" }));
      }
    }

    // GET /data – Retrieve all items
    else if (req.method === "GET" && url.pathname === "/data") {
      const data = await readDataFromFile();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    }

    // DELETE /data/:id – Delete an item by ID
    else if (req.method === "DELETE" && url.pathname.startsWith("/data/")) {
      eventEmitter.emit("deleteData", id);
      res.writeHead(204, { "Content-Type": "application/json" });
      res.end();
    }

    // If route is not found
    else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Route not found" }));
    }
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ message: "Internal server error", error: error.message })
    );
  }
});

// Start the server
const PORT = 4789;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

ts version

```ts
import http, { IncomingMessage, ServerResponse } from "http";
import { EventEmitter } from "events";
import fs from "fs";
import { parse } from "url";

const eventEmitter = new EventEmitter();
const DATA_FILE = "data.json";

// Define an interface for the data item
interface DataItem {
  id: number;
  [key: string]: any;
}

// Helper function to check if the data file exists or not
const ensureDataFileExists = async (): Promise<void> => {
  try {
    await fs.promises.access(DATA_FILE, fs.constants.F_OK);
  } catch (error) {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify([]));
  }
};

// Reads data from the file
const readDataFromFile = async (): Promise<DataItem[]> => {
  try {
    await ensureDataFileExists();
    const data = await fs.promises.readFile(DATA_FILE, "utf8");
    return JSON.parse(data) as DataItem[];
  } catch (error) {
    console.error("Error reading data file: ", error);
    return [];
  }
};

// Writes data to the file
const writeDataToFile = async (data: DataItem[]): Promise<void> => {
  try {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing data file: ", error);
  }
};

// Helper function to get the request body
const getRequestBody = (req: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
    req.on("error", (err) => reject(err));
  });
};

// Event handling for save, update, delete
eventEmitter.on("saveData", async (newData: DataItem) => {
  try {
    const data = await readDataFromFile();
    data.push(newData);
    await writeDataToFile(data);
  } catch (error) {
    console.error("Error saving data: ", error);
  }
});

eventEmitter.on("updateData", async (updatedData: DataItem) => {
  try {
    const data = await readDataFromFile();
    const index = data.findIndex((item) => item.id === updatedData.id);
    if (index !== -1) {
      data[index] = updatedData;
      await writeDataToFile(data);
    }
  } catch (error) {
    console.error("Error updating data: ", error);
  }
});

eventEmitter.on("deleteData", async (id: number) => {
  try {
    let data = await readDataFromFile();
    data = data.filter((item) => item.id !== id);
    await writeDataToFile(data);
  } catch (error) {
    console.error("Error deleting data: ", error);
  }
});

// Create server and handle different routes
const server = http.createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = parse(req.url || "", true);
      const id = parseInt(url.pathname?.split("/")[2] || "0", 10);

      // POST /data – Add a new item
      if (req.method === "POST" && url.pathname === "/data") {
        const body = await getRequestBody(req);
        const newData: DataItem = { ...JSON.parse(body), id: Date.now() };
        eventEmitter.emit("saveData", newData);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Data Saved", data: newData }));
      }

      // POST /data/multiple – Add multiple items at once
      else if (req.method === "POST" && url.pathname === "/data/multiple") {
        const body = await getRequestBody(req);
        const newItems: DataItem[] = JSON.parse(body).map((item: any) => ({
          ...item,
          id: Date.now() + Math.random(),
        }));
        newItems.forEach((item) => eventEmitter.emit("saveData", item));
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ message: "Multiple Data Saved", data: newItems })
        );
      }

      // PUT /data/:id – Update an item by ID
      else if (req.method === "PUT" && url.pathname?.startsWith("/data/")) {
        const body = await getRequestBody(req);
        const updatedData: DataItem = { ...JSON.parse(body), id };
        eventEmitter.emit("updateData", updatedData);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Data updated", data: updatedData }));
      }

      // PATCH /data/:id – Partially update an item by ID
      else if (req.method === "PATCH" && url.pathname?.startsWith("/data/")) {
        const body = await getRequestBody(req);
        const data = await readDataFromFile();
        const index = data.findIndex((item) => item.id === id);
        if (index !== -1) {
          data[index] = { ...data[index], ...JSON.parse(body) };
          await writeDataToFile(data);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: "Data partially updated",
              data: data[index],
            })
          );
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Data not found" }));
        }
      }

      // GET /data/:id – Retrieve a single item by ID
      else if (req.method === "GET" && url.pathname?.startsWith("/data/")) {
        const data = await readDataFromFile();
        const item = data.find((d) => d.id === id);
        if (item) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(item));
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Data not found" }));
        }
      }

      // GET /data – Retrieve all items
      else if (req.method === "GET" && url.pathname === "/data") {
        const data = await readDataFromFile();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      }

      // DELETE /data/:id – Delete an item by ID
      else if (req.method === "DELETE" && url.pathname?.startsWith("/data/")) {
        eventEmitter.emit("deleteData", id);
        res.writeHead(204, { "Content-Type": "application/json" });
        res.end();
      }

      // If route is not found
      else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Route not found" }));
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Internal server error",
          error: error.message,
        })
      );
    }
  }
);

// Start the server
const PORT = 4789;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

interface DataItem {
  id: number;
  [key: string]: any;
}
```

datas

```
[
  { "name": "Laptop", "price": 1000 },
  { "name": "Smartphone", "price": 700 },
  { "name": "Tablet", "price": 450 },
  { "name": "Headphones", "price": 150 },
  { "name": "Smartwatch", "price": 300 },
  { "name": "Keyboard", "price": 100 },
  { "name": "Mouse", "price": 50 },
  { "name": "Monitor", "price": 250 },
  { "name": "External Hard Drive", "price": 200 },
  { "name": "Webcam", "price": 120 },
  { "name": "Speaker", "price": 180 },
  { "name": "Printer", "price": 400 },
  { "name": "Router", "price": 80 },
  { "name": "Gaming Console", "price": 500 },
  { "name": "VR Headset", "price": 350 },
  { "name": "Drone", "price": 600 },
  { "name": "Digital Camera", "price": 800 },
  { "name": "Projector", "price": 900 },
  { "name": "Smart Light", "price": 60 },
  { "name": "Portable Charger", "price": 30 }
]

```
