import { PILOT_INFO_ENDPOINT } from "../constants"

interface IPersonData {
    pilotId: string
    email: string,
    phoneNumber: string,
    firstName: string
    lastName: string
}

export class Person {
    readonly created = Date.now()

    constructor(
        public readonly personData : IPersonData
    ) {}

    static validatePersonData(personData : any) : IPersonData {
        if (typeof personData.pilotId !== 'string') throw new Error('Invalid pilotId')
        if (typeof personData.email !== 'string') throw new Error('Invalid email')
        if (typeof personData.phoneNumber !== 'string') throw new Error('Invalid phoneNumber')
        if (typeof personData.firstName !== 'string') throw new Error('Invalid firstName')
        if (typeof personData.lastName !== 'string') throw new Error('Invalid lastName')

        return {
            ...personData,
            pilotId: personData.pilotId,
            email: personData.email,
            phoneNumber: personData.phoneNumber,
            firstName: personData.firstName,
            lastName: personData.lastName
        }
    }

    static async fetchPersonAPIJson(serialNumber : string) : Promise<any> {
        console.log('Fetching person data from API')
        try {
            const response = await fetch(PILOT_INFO_ENDPOINT.replace(':serialNumber', serialNumber))
            if (!response.ok) return null

            const reponseJson = await response.json()
        
            return reponseJson
        } catch(e) {
            console.error(e)
            return null
        }
        
    }

    static async fromModelId(modelId : string) : Promise<Person | null> {
        const personJson = await Person.fetchPersonAPIJson(modelId)
        if (personJson === null) return null

        const personData = Person.validatePersonData(personJson)
        const newPerson = new Person(personData)

        return newPerson
    }
}