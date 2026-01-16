# Swastha AI Backend

// ...existing code...

## API Documentation

Complete API documentation is available in the `docs/api-documentation.md` file. This includes:
- Detailed endpoint descriptions
- Request and response formats
- Authentication requirements
- CURL examples for testing

## Testing the API

### Using Postman
1. Import the Postman collection from `tests/postman_collection.json`
2. Configure the collection variables:
   - `baseUrl`: Your API base URL (default: http://localhost:3000)
   - After login, set the `authToken` variable with the returned token
   - After document upload or chat creation, set the corresponding IDs

### Using Shell Script
A shell script is provided for quick API testing with curl:

```bash
# Make the script executable
chmod +x tests/api-test.sh

# Run the tests
./tests/api-test.sh
```

The script will:
1. Register a test user
2. Login and obtain an authentication token
3. Test all major API endpoints
4. Clean up created resources

### Manual Testing with curl
You can manually test endpoints using the curl examples provided in the API documentation.

// ...existing code...
