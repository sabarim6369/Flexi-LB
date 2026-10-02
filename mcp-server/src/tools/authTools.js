/**
 * Authentication Tools
 * These tools help with authentication for the FlexiLB MCP server
 */
import axios from 'axios';
import dotenv from 'dotenv';

// Suppress all output from dotenv to avoid stdio pollution
const originalLog = console.log;
const originalError = console.error;
console.log = () => {};
console.error = () => {};
dotenv.config();
console.log = originalLog;
console.error = originalError;

export const authTools = [
  {
    name: 'login',
    description: 'Login to FlexiLB with email and password to get authentication token',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'User email address',
        },
        password: {
          type: 'string',
          description: 'User password',
        },
      },
      required: ['email', 'password'],
    },
    handler: async (args, client) => {
      try {
        // Create a temporary axios instance for login (doesn't need auth)
        const baseURL = process.env.FLEXILB_API_URL || 'http://localhost:3003';
        const tempClient = axios.create({
          baseURL,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const response = await tempClient.post('/auth/login', {
          email: args.email,
          password: args.password
        });
        
        // Set the token dynamically in the client
        client.setAuthToken(response.data.token);
        
        return {
          success: true,
          message: 'Login successful - authentication token set automatically',
          token: response.data.token,
          user: response.data.user,
          authenticated: true
        };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
          message: 'Login failed. Please check your credentials.'
        };
      }
    },
  },
  {
    name: 'verify_token',
    description: 'Verify if the current authentication token is valid',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (args, client) => {
      try {
        if (!client.isAuthenticated()) {
          return {
            success: false,
            valid: false,
            message: 'No authentication token set. Please login first.'
          };
        }
        
        // Try to check token validity
        const response = await client.client.post('/auth/user/check-validity');
        
        return {
          success: true,
          valid: true,
          message: 'Authentication token is valid'
        };
      } catch (error) {
        return {
          success: false,
          valid: false,
          error: error.response?.data?.error || error.message,
          message: 'Authentication token is invalid or expired'
        };
      }
    },
  },
  {
    name: 'check_auth_status',
    description: 'Check if currently authenticated with FlexiLB',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (args, client) => {
      return {
        authenticated: client.isAuthenticated(),
        hasToken: !!client.apiToken,
        message: client.isAuthenticated() 
          ? 'Currently authenticated with FlexiLB' 
          : 'Not authenticated. Please use the login tool first.'
      };
    },
  },
  {
    name: 'get_current_user',
    description: 'Get information about the currently authenticated user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (args, client) => {
      try {
        if (!client.isAuthenticated()) {
          return {
            success: false,
            error: 'Not authenticated',
            message: 'Please login first using the login tool'
          };
        }
        
        const response = await client.client.get('/auth/user/byid');
        
        return {
          success: true,
          user: response.data,
          message: 'Current user information retrieved successfully'
        };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
          message: 'Failed to get current user information'
        };
      }
    },
  },
];