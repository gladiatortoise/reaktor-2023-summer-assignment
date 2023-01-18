import { Drone, IDroneTree } from "./Drone"
import { groupBy, xmlParser } from "../utils"
import { DELETE_DRONE_AFTER, DRONES_ENDPOINT } from "../constants"

export class MutatingDroneList {
    lastUpdated = Date.now()
    
    constructor(
        public droneTree: IDroneTree = {}
    ) {}

    static async createFromAPI() : Promise<MutatingDroneList> {
        const dronesReport = await MutatingDroneList.fetchReport()
        const drones = await MutatingDroneList.dronesFromReport(dronesReport)
        const dronesTree = await MutatingDroneList.listToTree(drones)

        return new MutatingDroneList(dronesTree)
    }

    static async listToTree(drones : Drone[]) : Promise<IDroneTree> {
        const dronesTree = groupBy(drones, (d : Drone) => d.drone.serialNumber)
        const dronesTreeSingle = Object.keys(dronesTree).reduce((acc, key) => {
            acc[key] = dronesTree[key]![0]!
            return acc
        }, {} as IDroneTree)

        return dronesTreeSingle
    }

    static async dronesFromReport(report : any) : Promise<Drone[]> {
        const rawDrones = report['report']['capture']['drone']!

        const drones = await Promise.all(rawDrones.map(async (rawDrone : any) => {
            const validatedData = Drone.validateDroneData(rawDrone)
            var newDrone = new Drone(validatedData)
            
            return newDrone
        }))

        return drones
    }

    static async fetchReport() : Promise<any> {
        const response = await fetch(DRONES_ENDPOINT)
        const reponseText = await response.text()
        const reponseParsed = xmlParser.parse(reponseText)
    
        return reponseParsed
    }

    async updateWith(other : MutatingDroneList) : Promise<void> {
        for (const [key, drone] of Object.entries(this.droneTree)) {
            if (!other.hasOwnProperty(key)) {
                drone.mbyInactive = true
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

    async deleteOldDrones() : Promise<void> {
        for (const [key, drone] of Object.entries(this.droneTree)) {
            if (Date.now() - drone.lastUpdated > DELETE_DRONE_AFTER) {
                delete this.droneTree[key]
            }
        }
    }

    async deleteOutdatedViolationData() : Promise<void> {
        for (const [key, drone] of Object.entries(this.droneTree)) {
            if (drone.needsViolationDataDeleted()) {
                this.droneTree[key]?.deleteViolationData()
            }
        }
    }

    async update() : Promise<void> {
        const newList = await MutatingDroneList.createFromAPI()
        await this.updateWith(newList)
        await this.deleteOutdatedViolationData()
        await this.deleteOldDrones()
        this.lastUpdated = Date.now()
    }
}
