import { MutatingDroneList } from "./DroneList"

export class DroneListPoller {
    interval : NodeJS.Timer | null = null
    list : MutatingDroneList = new MutatingDroneList()

    constructor() {}

    async poll() {
        this.list.update()
        //console.log(this.list)
    }

    // periodally poll drone list
    start() : DroneListPoller {
        this.interval = setInterval(() => {
            this.poll()
        }, 1010)

        return this
    }

    stop() {
        clearInterval(this.interval!)
    }

    getListOfDrones() : string {
        return JSON.stringify(this.list.droneTree)
    }
}
