import { DELETE_PERSON_AFTER, NO_FLIGHT_ZONE_CENTER, NO_FLIGHT_ZONE_RADIUS } from "../constants"
import { Person } from "./Person"

export interface IDroneData {
    serialNumber: string
    positionX: number
    positionY: number
}

export interface IViolationData {
    lastSeenViolating: number,
    closestDistance: number,
    owner: Person | null
}

export interface IDroneTree {
    [serialNumber : string]: Drone
}

export class Drone {
    distance : number | null = null
    lastUpdated = Date.now()
    isViolatingNFZ : boolean = false
    violationData : IViolationData | null = null
    mbyInactive = false

    constructor(public drone : IDroneData) {
        this.updateWithData(drone)
    }

    // update this drone with the data from another drone
    async updateWithData(droneData : IDroneData) : Promise<void> {
        this.drone = droneData
        this.distance = this.calculateDistance()
        this.isViolatingNFZ = this.distance !== null ? this.distance < NO_FLIGHT_ZONE_RADIUS : false
        this.lastUpdated = Date.now()
        
        if (this.isViolatingNFZ) {
            // add violation data because the drone is violating the no flight zone
            // if it already has violation data, update it
            this.violationData = {
                lastSeenViolating: Date.now(),
                closestDistance: Math.min(this.distance!, this.violationData?.closestDistance ?? Infinity),
                owner: this.violationData?.owner ?? null // new owner is not pulled here, because it might not be needed in the case this list is merged to a previous one
            }
        }
    }

    // add owner to this drone's violation data. Return true if succesfull, else false
    async addOwner() : Promise<boolean> {
        if (this.violationData !== null) {
            try {
                this.violationData.owner = await Person.fromModelId(this.drone.serialNumber)
                
                return true
            } catch(e) {
                return false
            }
        } else {
            return false
        }
    }

    // calculate distance from drone to no flight zone center
    calculateDistance() : number | null {
        if (this.drone === null) {
            return null
        } else {
            return Math.sqrt(Math.pow(this.drone.positionX - NO_FLIGHT_ZONE_CENTER.x, 2) + Math.pow(this.drone.positionY - NO_FLIGHT_ZONE_CENTER.y, 2))
        }
    }

    static validateDroneData(droneData : any) : IDroneData {
        if (typeof droneData['serialNumber'] !== 'string') throw new Error('Invalid serial number')
        if (typeof droneData['positionX'] !== 'number') throw new Error('Invalid position X')
        if (typeof droneData['positionY'] !== 'number') throw new Error('Invalid position Y')

        return {
            ...droneData,
            serialNumber: droneData['serialNumber'],
            positionX: droneData['positionX'],
            positionY: droneData['positionY']
        }
    }

    // check if drone has been inactive for too long
    needsViolationDataDeleted() : boolean {
        let lastSeenViolating = this.violationData?.lastSeenViolating
        if (lastSeenViolating !== undefined) {
            const timeSinceLastSeenViolating = Date.now() - lastSeenViolating
            if (timeSinceLastSeenViolating > DELETE_PERSON_AFTER) {
                return true
            }
        }
        
        return false
    }

    async deleteViolationData() : Promise<void> {
        this.violationData = null
    }
}