import express from 'express';
import { createAuthMiddleware } from '../auth-middleware';
import { storage } from '../storage';

const portalRouter = express.Router();

// Get all clients
portalRouter.get("/clients", createAuthMiddleware(1), async (req, res, next) => {
  try {
    const clients = await storage.getClients();
    res.json(clients);
  } catch (error) {
    next(error);
  }
});

// Get client loads/tracking data
portalRouter.get("/tracking", createAuthMiddleware(1), async (req, res, next) => {
  try {
    const loads = await storage.getLoads();
    res.json(loads);
  } catch (error) {
    next(error);
  }
});

// Get client invoices
portalRouter.get("/invoices", createAuthMiddleware(1), async (req, res, next) => {
  try {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  } catch (error) {
    next(error);
  }
});

// Get client account information
portalRouter.get("/account", createAuthMiddleware(1), async (req, res, next) => {
  try {
    // If we have a clientId query parameter, get that client
    // Otherwise, get all clients
    const { clientId } = req.query;
    if (clientId) {
      const client = await storage.getClient(parseInt(clientId as string));
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } else {
      const clients = await storage.getClients();
      res.json(clients);
    }
  } catch (error) {
    next(error);
  }
});

// Get client documents
portalRouter.get("/documents", createAuthMiddleware(1), async (req, res, next) => {
  try {
    const { clientId } = req.query;
    
    // Mock document data
    const documents = [
      {
        id: 1,
        clientId: 1,
        name: "Service Agreement",
        type: "contract",
        uploadDate: "2025-01-15",
        size: "1.2 MB"
      },
      {
        id: 2,
        clientId: 1,
        name: "Rate Card",
        type: "pricing",
        uploadDate: "2025-01-15",
        size: "0.5 MB"
      },
      {
        id: 3,
        clientId: 2,
        name: "Master Service Agreement",
        type: "contract",
        uploadDate: "2025-02-10",
        size: "1.8 MB"
      },
      {
        id: 4,
        clientId: 1,
        name: "Insurance Certificate",
        type: "compliance",
        uploadDate: "2025-03-01",
        size: "0.7 MB"
      }
    ];
    
    if (clientId) {
      const clientDocuments = documents.filter(doc => doc.clientId === parseInt(clientId as string));
      res.json(clientDocuments);
    } else {
      res.json(documents);
    }
  } catch (error) {
    next(error);
  }
});

export default portalRouter;