# Shelter Google Maps Integration

## Overview
Updated the User Dashboard shelter section to open Google Maps when users click "Get Directions" buttons.

## Changes Made

### User Dashboard (`pages/UserDashboard.js`)

1. **Added `openGoogleMaps()` helper function**:
   ```javascript
   const openGoogleMaps = (locationName) => {
     const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`;
     window.open(mapsUrl, '_blank');
   };
   ```

2. **Updated "Get Directions" buttons** for each shelter:
   - **Community Center A**: Opens Google Maps search for "Community Center A Mumbai"
   - **School Shelter B**: Opens Google Maps search for "School Shelter B Mumbai"
   - **Temple Shelter C**: Remains disabled (shelter is full)

## Implementation Details

### Google Maps URL Format
Uses Google Maps URL API with search query:
```
https://www.google.com/maps/search/?api=1&query=<location_name>
```

### Button Behavior
- Opens in new tab (`_blank` target)
- Uses `window.open()` for cross-browser compatibility
- Automatically encodes location names for URL safety

## User Flow

1. User navigates to "Shelters" section in sidebar
2. Views available shelters with capacity info
3. Clicks "Get Directions" button
4. Google Maps opens in new tab with shelter location search
5. User can:
   - View shelter on map
   - Get turn-by-turn directions
   - See estimated travel time
   - Choose transportation mode (car, walk, bike, transit)

## Example URLs Generated

- **Community Center A**: 
  `https://www.google.com/maps/search/?api=1&query=Community+Center+A+Mumbai`

- **School Shelter B**: 
  `https://www.google.com/maps/search/?api=1&query=School+Shelter+B+Mumbai`

## Future Enhancements

1. **Real Shelter Coordinates**: Replace search queries with actual lat/lng coordinates
   ```
   https://www.google.com/maps/search/?api=1&query=19.0760,72.8777
   ```

2. **Directions from Current Location**: Use Google Maps Directions API
   ```
   https://www.google.com/maps/dir/?api=1&destination=19.0760,72.8777
   ```

3. **Dynamic Shelter Data**: Fetch shelter locations from backend API
   ```javascript
   const shelters = await fetch('/api/shelters').then(r => r.json());
   ```

4. **Distance Calculation**: Show actual distance from user's current location

5. **Embedded Map**: Display shelter locations directly in the dashboard using Google Maps Embed API

## Testing

1. Navigate to User Dashboard
2. Click "Shelters" in sidebar
3. Click "Get Directions" on Community Center A
4. Verify Google Maps opens in new tab
5. Verify search shows relevant results
6. Repeat for School Shelter B

## Notes

- Temple Shelter C button remains disabled (shelter is full)
- Location names are URL-encoded automatically
- Works on all modern browsers
- No API key required for basic search functionality
