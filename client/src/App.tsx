import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';

interface IDrones {
  [key: string]: {
    distance: number,
    drone: {
      serialNumber: string,
      positionX: number,
      positionY: number
    },
    isViolatingNFZ: boolean,
    mbyInactive: boolean,
    violationData: {
      lastSeenViolating: number,
      closestDistance: number,
      owner: {
        personData: {
          email: string,
          phoneNumber: string,
          firstName: string
          lastName: string
        }
      } | null
    } | null
  }
}

const prettyPrintTime = (time: number) => {
  const seconds = Math.floor(time)
  const minutes = Math.floor(seconds / 60)

  if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${seconds}s`
  }
}

const sortDrones = (drones: IDrones) => {
  return Object.keys(drones).sort((a, b) => {
    let aViolation = drones[a].violationData
    let bViolation = drones[b].violationData

    if (aViolation && !bViolation) {
      return 1
    } else if (!aViolation && bViolation) {
      return -1
    } else if (!aViolation && !bViolation) {
      return 0
    } else {
      return bViolation!.lastSeenViolating - aViolation!.lastSeenViolating
    }
  })
}

function App() {
  const [drones, setDrones] = useState<IDrones>({})

  useEffect(() => {
    console.log(drones)

    const int = setInterval(() => {
      fetch('https://automeme.app:6092/drones')
      .then(res => res.json())
      .then(data => setDrones(data))
    }, 1000)
    
    return () => {
      clearInterval(int)
    }
  })

  return (
    <div className="centered">
      <h1 className="heading">Birdwatch</h1>
      <hr />
      <div className="drone-map">
        <div className="drone-list">
          {Object.values(drones).filter(x => !x.mbyInactive).map((drone) => {
            return (
              <div key={drone.drone.serialNumber} className="drone-on-map" style={
                {
                  left: `calc(${drone.drone.positionX / 5000}% - var(--drone-width)/2)`,
                  top: `calc(${drone.drone.positionY / 5000}% - var(--drone-width)/2)`,
                  border: drone.isViolatingNFZ ? '2px solid red' : 'none'
                }}
              />
            )
          })}
        </div>
        <div className="no-fly-zone" />
      </div>
      <hr />
      <div className="table-container">
        <table className="table table-hover">
          <thead>
            <tr>
              <th scope="col">Pilot Name</th>
              <th scope="col">Last violation</th>
              <th scope="col">Closest Distance</th>
              <th scope="col">Email Address</th>
              <th scope="col">Phone Number</th>
              
            </tr>
          </thead>
          <tbody>
            {sortDrones(drones).map((key) => {
              const drone = drones[key]

              if (drone.violationData) {
                return (
                  <tr key={key} style={
                    {
                      color: drone.isViolatingNFZ ? 'red' : 'white',
                      fontWeight: drone.isViolatingNFZ ? 'bold' : 'normal'
                    }
                  }>
                    <td>{drone.violationData.owner?.personData?.firstName} {drone.violationData.owner?.personData?.lastName}</td>
                    <td>{prettyPrintTime((Date.now() - drone.violationData.lastSeenViolating)/1000)} ago</td>
                    <td>{Math.ceil(drone.violationData.closestDistance / 1000)}m</td>
                    <td>{drone.violationData.owner?.personData?.email}</td>
                    <td>{drone.violationData.owner?.personData?.phoneNumber}</td>
                  </tr>
                )
              }
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
