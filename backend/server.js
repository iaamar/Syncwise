const express = require('express');
const http = require('http');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const { createContext } = require('./middleware/auth');
const setupSocket = require('./socket');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const httpServer = http.createServer(app);

// Connect to database
connectDB();

// Create Apollo Server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: createContext,
  formatError: (error) => {
    // Log server errors but don't expose internal details to clients
    if (error.originalError) {
      console.error(error);
    }
    
    // Return a more user-friendly error message
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
      extensions: {
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      }
    };
  },
});

// Apply Apollo middleware
async function startServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });
  
  // Setup Socket.io
  setupSocket(httpServer);
  
  // Start server
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});