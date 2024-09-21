import http from 'http';
import { EventEmitter } from 'events';
import fs from 'fs';
import { parse } from 'url';

const eventEmitter = new EventEmitter();
const DATA_FILE = 'data.json'

//helper function to check if the data file exists or not
const ensureDataFileExists = async () => {
    try {
        await fs.promises.access(DATA_FILE, fs.constants.F_OK);
    } catch (error) {
        //if does not exist,create an empty array as a starting point
        await fs.promises.writeFile(DATA_FILE, JSON.stringify([]));
    }
};

//reads data from the file
const readDataFromFile = async () => {
    try {
        await ensureDataFileExists();
        const data = await fs.promises.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data file: ', error);
        return [];
    }
};

//writes data to the file
const writeDataToFile = async (data) => {
    try {
        await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data file: ', error);
    }
};

//listen for new data saving or post event
eventEmitter.on('saveData', async (newData) => {
    try {
        const data = await readDataFromFile();
        data.push(newData);
        await writeDataToFile(data);
        console.log('Data saved: ', newData);
    } catch (error) {
        console.error('Error saving data: ', error);
    }
});

//listen for data updating event
eventEmitter.on('updateData', async (updatedData) => {
    try {
        const data = await readDataFromFile();
        const index = data.findIndex(item => item.id == updatedData.id);
        if (index !== -1) {
            data[index] = updatedData;
            await writeDataToFile(data);
            console.log('Data updated: ', updatedData);
        }
    } catch (error) {
        console.error('Error updating data: ', error);
    }
});

//listen for data deletion event
eventEmitter.on('deleteData', async (id) => {
    try {
        let data = await readDataFromFile();
        data = data.filter(item => item.id !== id);
        await writeDataToFile(data);
        console.log(`Data with id ${id} deleted`);
    } catch (error) {
        console.error('Error deleting data: ', error);
    }
});

//parse request body 
const getRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => resolve(body));
        req.on('error', err => reject(err));
    });
};

//lets create the server now
const server = http.createServer(async (req, res) => {
    try {
        const url = parse(req.url || '', true);
        const id = parseInt(url.pathname?.split('/')[2] || '0', 10);

        //post data 
        if (req.method === 'POST' && url.pathname === '/data') {
            const body = await getRequestBody(req);
            const newData = { ...JSON.parse(body), id: Date.now() };
            eventEmitter.emit('saveData', newData);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Data Saved', data: newData }));
        }

        //update data
        else if (req.method === 'GET' && URL.pathname.startsWith('/data/')) {
            const body = await getRequestBody(req);
            const updatedData = { ...JSON.parse(body), id };
            eventEmitter.emit('updateData', updatedData);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Data updated', data: updatedData }));
        }

        //get the all the data
        else if (req.method === 'GET' && url.pathname === '/data') {
            const data = await readDataFromFile();
            res.writeHead(200, { 'Content-Type': 'application//json' });
            res.end(JSON.stringify(data));
        }

        //delete a data
        else if (req.method === 'DELETE' && url.pathname.startsWith('/data/')) {
            eventEmitter.emit('deleteData', id);
            res.writeHead(204, { 'Content-Type': 'application/json' });
            res.end();
        }
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Route not found' }));
        }
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal server error', error: error.message }));
    }
});

const PORT = 4789
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Home Route localhost:${PORT}`);
})