# Flexi-LB 🚦

A **UI-based flexible load balancer** that makes managing servers simple, visual, and efficient.

## Overview

Flexi-LB is designed to **take the complexity out of load balancing**.  
Instead of juggling configuration files or terminal commands, you get a **clean web dashboard** where you can:

- Add or remove backend servers with just a few clicks  
- Configure balancing strategies from drop-down menus  
- Watch live server health updates  
- Receive alerts when a server goes down or recovers  

This makes it accessible for both developers and teams who prefer a **visual, user-friendly experience**.

## Features ✨

- 🎛️ **UI-based management** – everything from a dashboard  
- 🔄 **Load balancing strategies** – round-robin, least connections, or custom rules  
- ❤️ **Health monitoring** – automatic detection of failed servers  
- 🚨 **Real-time alerts** – notifications when servers are unhealthy  
- 🧩 **Extensible design** – easy to add new features or integrations  

## How It Works ⚙️

1. **Dashboard (UI)** – Manage servers, configure strategies, and monitor status.  
2. **Backend Core** – Routes traffic according to chosen strategy.  
3. **Health Monitor** – Continuously pings servers, updating the dashboard.  
4. **Notification Service** – Sends alerts when failures or recoveries happen.  


## Tech Stack 🛠

- **Frontend (UI):** React + Vite (flexi-view-ui)  
- **Backend API:** Bun + Hono  
- **Database:** MongoDB (server configs, user data, alerts)  
- **Message Queue:** RabbitMQ (hosted on CloudAMQP)  
- **Deployment:** Vercel (UI) + Render/other (backend)  

## Getting Started 🚀

### Prerequisites

- Node.js v18+  
- MongoDB Atlas or local MongoDB  
- RabbitMQ  

### Installation

```bash
# Clone the repo
git clone https://github.com/sabarim6369/Flexi-LB.git

# Backend setup
cd Server
npm install

# Frontend setup
cd ../flexi-view-ui
npm install



# Start backend
cd Server
npm run dev

# Start frontend
cd ../flexi-view-ui
npm run dev



Environment Variables

Create a .env file in both backend and frontend. Example:

MONGO_URI=your-mongodb-uri
RABBITMQ_URL=amqp://localhost
PORT=4000
```


## Contributors 👨‍💻

### Built with ❤️ by:

### - **Sabari M** – Owner & Maintainer  

## Contributors are always welcome! Open a PR and join the project 🚀

## License 📄

## This project is licensed under the MIT License.


