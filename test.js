const items = [
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
];

const updatedItems = items.map(item => {
  return { 
    ...item, 
    id: Date.now() + Math.floor(Math.random() * 10000) // Generate integer ID
  };
});

console.log(updatedItems);
