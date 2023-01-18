import express from 'express'
import { DroneListPoller } from './classes/DroneListPoller'
import { PORT } from './constants'
import cors from 'cors'

const shortPoller = new DroneListPoller().start()
const app = express()

app.use(cors({
    'allowedHeaders': ['Content-Type'],
    'origin': '*',
    'preflightContinue': true
}));

app.get('/drones', (req, res) => {
    req
    res.send(shortPoller.getListOfDrones())
})

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})