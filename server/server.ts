import express from 'express'
import { DroneListPoller } from './classes/DroneListPoller'
import { PORT } from './constants'

const shortPoller = new DroneListPoller().start()
const app = express()

app.get('/drones', (req, res) => {
    req
    res.send(shortPoller.getListOfDrones())
})

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})