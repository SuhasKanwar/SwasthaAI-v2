# Doctor Search System Documentation

## Overview

The doctor search system provides location-based search functionality with smart ranking based on multiple factors including distance and experience. The system will be enhanced with hospital addresses in the future to provide more accurate location-based results.

## API Endpoints

### 1. Search Doctors
**Endpoint:** `GET /api/doctors/search`

Search for doctors with filtering and sorting based on location, specialty, and other criteria.

**Query Parameters:**
- `lat` (optional): Latitude of user's location
- `lng` (optional): Longitude of user's location
- `specialty` (optional): Medical specialty (e.g., "Cardiologist")
- `name` (optional): Doctor's name for filtering
- `languages` (optional): Comma-separated list of languages
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response:**
```json
{
  "status": "success",
  "data": {
    "doctors": [
      {
        "id": 1,
        "displayName": "Dr. John Doe",
        "specialty": "Cardiologist",
        "profilePicture": "https://...",
        "expertiseAreas": ["Heart Surgery", "Cardiac Care"],
        "clinicName": "Heart Care Center",
        "yearsOfExperience": 15,
        "languagesSpoken": ["English", "Hindi"],
        "email": "john@example.com",
        "isVerified": true,
        "score": 85.5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### 2. Get Nearby Doctors
**Endpoint:** `GET /api/doctors/nearby`

Get doctors sorted by proximity to a given location.

**Query Parameters:**
- `lat` (required): Latitude of user's location
- `lng` (required): Longitude of user's location
- `limit` (optional): Maximum number of results (default: 5)

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "displayName": "Dr. Jane Smith",
      "specialty": "Pediatrician",
      "clinicName": "Kids Care Clinic",
      "yearsOfExperience": 10,
      "score": 75.2
    }
  ]
}
```

## Ranking Algorithm

The search system uses a sophisticated ranking algorithm that considers multiple factors:

### Distance Scoring
- Very Close (≤ 2km): 80% weight
- Medium Distance (≤ 5km): 60% weight
- Far (≤ 20km): 40% weight
- Very Far (≤ 50km): Standard 60% weight

### Experience Scoring
- Base score = yearsOfExperience × 5
- Used as a proxy for ratings until rating system is implemented

### Final Score Calculation
```typescript
finalScore = (distanceScore × distanceWeight) + (experienceScore × experienceWeight)
```

Where:
- `distanceScore` = 100 × (1 - distance/50000)
- `experienceScore` = yearsOfExperience × 5
- `distanceWeight` + `experienceWeight` = 1

## Technical Details

### Distance Calculation
Uses Google Maps Distance Matrix API to calculate accurate real-world driving distances:

```typescript
// Using Google Maps Distance Matrix API
const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
  params: {
    origins: `${origin.latitude},${origin.longitude}`,
    destinations: `${destination.latitude},${destination.longitude}`,
    mode: 'driving',
    key: API_KEY
  }
});

// Extract distance value in meters
const distance = response.data.rows[0].elements[0].distance.value;
```

With Haversine formula as fallback when API is unavailable:

```typescript
// Haversine formula (fallback)
R = 6371e3 // Earth's radius in meters
φ1 = lat1 in radians
φ2 = lat2 in radians
Δφ = (lat2-lat1) in radians
Δλ = (lon2-lon1) in radians

a = sin²(Δφ/2) + cos(φ1)·cos(φ2)·sin²(Δλ/2)
c = 2·atan2(√a, √(1−a))
d = R·c // Distance in meters
```

### Database Schema (Doctor Profile)
```prisma
model DoctorProfile {
  id                         Int      @id @default(autoincrement())
  userId                     Int
  displayName                String   @db.VarChar(255)
  specialty                  String   @db.VarChar(255)
  expertiseAreas             Json
  clinicName                 String   @default("Dr. X")
  yearsOfExperience         Int
  languagesSpoken           Json
  providesOnlineConsultation Boolean  @default(false)
  // ... other fields
}
```

## Error Handling

### Common Error Responses
```json
{
  "status": "error",
  "message": "Invalid coordinates provided"
}
```

```json
{
  "status": "error",
  "message": "Doctor not found"
}
```

### HTTP Status Codes
- 200: Successful request
- 400: Invalid parameters
- 404: Doctor not found
- 500: Server error














## Future Enhancements

-Concurrency of appointments(Lock && Booking)

1. **Hospital Addresses Integration**
   - Add hospital locations to enable accurate distance calculations
   - Support multiple practice locations per doctor

2. **Rating System**
   - Implement patient ratings and reviews
   - Update scoring algorithm to include rating weight

3. **Advanced Filters**
   - Insurance providers 
   - Available appointment slots 
   - Consultation fees
   - Online consultation availability

4. **Geospatial Queries**
   - Implement PostgreSQL PostGIS for efficient location queries
   - Add radius-based searching
   - Support polygon-based area searches