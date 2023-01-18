import { PILOT_INFO_ENDPOINT } from "../constants"

interface IPersonData {
    pilotId: string
    firstName: string
    lastName: string
}

export class Person {
    readonly created = Date.now()

    constructor(
        public readonly personData : IPersonData
    ) {}

    static validatePersonData(personData : any) : IPersonData {
        // @todo: bang doesn't actually assert in typescript
        return {
            ...personData,
            pilotId: personData.pilotId!,
            firstName: personData.firstName!,
            lastName: personData.lastName!
        }
    }

    static async fetchPersonAPIJson(serialNumber : string) : Promise<any> {
        console.log('Fetching person data from API')
        const response = await fetch(PILOT_INFO_ENDPOINT.replace(':serialNumber', serialNumber))
        if (!response.ok) return null

        const reponseJson = await response.json()
    
        return reponseJson
    }

    static async fromModelId(modelId : string) : Promise<Person | null> {
        const personJson = await Person.fetchPersonAPIJson(modelId)
        if (personJson === null) return null

        const personData = Person.validatePersonData(personJson)
        const newPerson = new Person(personData)

        return newPerson
    }
}