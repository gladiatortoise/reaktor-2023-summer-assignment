import { Drone, IDroneTree } from "./Drone"
import { groupBy, xmlParser } from "../utils"
import { DELETE_DRONE_AFTER, DRONES_ENDPOINT } from "../constants"

export class MutatingDroneList {
    lastUpdated = Date.now()
    
    constructor(
        // data structure / map that contains all drones
        public droneTree: IDroneTree = {}
    ) {}

    // create a new MutatingDroneList instance from the API
    static async createFromAPI() : Promise<MutatingDroneList> {
        const dronesReport = await MutatingDroneList.fetchReport()
        const drones = await MutatingDroneList.dronesFromReport(dronesReport)
        const dronesTree = await MutatingDroneList.listToTree(drones)

        return new MutatingDroneList(dronesTree)
    }

    // transform a list of drones to a tree/map
    static async listToTree(drones : Drone[]) : Promise<IDroneTree> {
        const dronesTree = groupBy(drones, (d : Drone) => d.drone.serialNumber)
        const dronesTreeSingle = Object.keys(dronesTree).reduce((acc, key) => {
            acc[key] = dronesTree[key]![0]!
            return acc
        }, {} as IDroneTree)

        return dronesTreeSingle
    }

    // get list of Drone instances from the report object
    static async dronesFromReport(report : any) : Promise<Drone[]> {
        const rawDrones = report['report']['capture']['drone']!

        const drones = await Promise.all(rawDrones.map(async (rawDrone : any) => {
            const validatedData = Drone.validateDroneData(rawDrone)
            var newDrone = new Drone(validatedData)
            
            return newDrone
        }))

        return drones
    }

    // get parsed xml object from api that contain's drones data
    static async fetchReport() : Promise<any> {
        const response = await fetch(DRONES_ENDPOINT)
        const reponseText = await response.text()
        const reponseParsed = xmlParser.parse(reponseText)
    
        return reponseParsed
    }

    // update this DroneList instance with the data from another DroneList instance
    async updateWith(other : MutatingDroneList) : Promise<void> {
        for (const [key, drone] of Object.entries(this.droneTree)) {
            if (!other.hasOwnProperty(key)) {
                drone.mbyInactive = true
                drone.isViolatingNFZ = false
            }
        }

        for (const newDrone of Object.values(other.droneTree)) {
            const serial = newDrone.drone.serialNumber
            const oldDrone = this.droneTree[serial]
            if (oldDrone) {
                oldDrone.updateWithData(newDrone.drone)
            } else {
                this.droneTree[serial] = newDrone
            }

            this.droneTree[serial]!.mbyInactive = false
        }

        for (const drone of Object.values(this.droneTree)) {
            if (drone.violationData && !drone.violationData.owner) {
                await drone.addOwner()
            }
        }
    }

    // delete old drones that have not been updated in DELETE_DRONE_AFTER ms
    async deleteOldDrones() : Promise<void> {
        for (const [key, drone] of Object.entries(this.droneTree)) {
            if (Date.now() - drone.lastUpdated > DELETE_DRONE_AFTER) {
                delete this.droneTree[key]
            }
        }
    }

    // delete violation data from drones that don't need it anymore because it's sensitive information
    async deleteOutdatedViolationData() : Promise<void> {
        for (const [key, drone] of Object.entries(this.droneTree)) {
            if (drone.needsViolationDataDeleted()) {
                this.droneTree[key]?.deleteViolationData()
            }
        }
    }

    // update this DroneList instance with the data from the API
    async update() : Promise<void> {
        try {
            const newList = await MutatingDroneList.createFromAPI()
            await this.updateWith(newList)
            await this.deleteOutdatedViolationData()
            await this.deleteOldDrones()
            this.lastUpdated = Date.now()
        } catch(e) {
            console.error(e)
        }
    }
}
