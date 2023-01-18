export const DRONES_ENDPOINT = `https://assignments.reaktor.com/birdnest/drones`
export const PILOT_INFO_ENDPOINT = `https://assignments.reaktor.com/birdnest/pilots/:serialNumber`
export const NO_FLIGHT_ZONE_RADIUS = 100000 // 100 meters
export const NO_FLIGHT_ZONE_CENTER = { x: 250000, y: 250000 }
export const DELETE_PERSON_AFTER = 1000 * 60 * 10 // 10 minutes
export const DELETE_DRONE_AFTER = 1000 * 60 * 10 // 10 minutes
export const PORT = 6090