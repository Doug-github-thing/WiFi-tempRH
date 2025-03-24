// For building the plot using recharts
import { LineChart, ResponsiveContainer, Line, XAxis, YAxis, Legend, Tooltip } from 'recharts'; // Historical data visualization
// For displaying the mouseover tooltip
import { CustomTooltip } from './CustomTooltip.js';
// For list view toggle button click function
import React, { useState } from 'react';

/** 
 * Renders the provided data as a plot.
 * Accepts a raw data array as props. Displays the data in a graph.
 * Has a button to switch between graph and list view for raw data.
 */
export const HistoricalDataPlot = ({ data }) => {

    // const [data, setData] = useState(); // tracks historical data to render in graph
    const [inListView, setInListView] = useState(false); // tracks if graph is in list view

    // Toggles the ListView state.
    // Called on button click.
    const toggleListView = () => {
        inListView ? setInListView(false) : setInListView(true);
    }

    // Returns an array of the form [lower, upper] (ie [32, 80] for graph range)
    // for the specified key, either "temp" or "rh"
    // Called when determining how to scale Y axes
    const getYAxisRange = (key) => {
        if (!data)
            return [0,0];

        let dataMap;
        // Isolates temp data
        if (key === "temp")
            dataMap = data.map(dataPoint => Number(dataPoint.temp));
        else if (key === "rh")
            dataMap = data.map(dataPoint => Number(dataPoint.rh));

        // Looks for the lowest and highest values in the data map
        let min = Infinity, max = -Infinity;
        let value = 0;
        for (value of dataMap) {
            if (value<min) min = Number(value);
            if (max<value) max = Number(value);
        }
        
        // Round the boundaries and return
        return [Math.floor(min) - 3, Math.ceil(max) + 3];
    }

    // Converts a SQL (ISO 8601) timestamp to a human readable M/D/Y HH:MM
    // Called when treating data prior to displaying.
    const convertTimestamp = (timestamp) => {
        const date = new Date(timestamp)
        date.toLocaleDateString('en-US');
        console.log(`Converted to a date, I get: ${date}`);
        const mystr = date.toLocaleString(
            [], {month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'})
        console.log(`Converted to a str, I get: ${mystr}`);
        // const day = date.getDay();
        // const month = date.getMonth();
        // const year = date.getFullYear();
        // const hours = date.getHours();
        // const minutes = String(date.getMinutes()).padStart(2, '0');
        return mystr;
        
        // return `${month}/${day}/${year} ${hours}:${minutes}`;
    }


    // Build plot structure
    return (<>
        {!data ? <div>Loading graph...</div> : // If there's data, render it!
            <>
                <div>
                    {/* <div>{title}</div> */}
                    <button onClick={toggleListView}>{inListView ? "Show Graph" : "Show List"}</button>
                </div>

            {!inListView ?
                // If we're not in list view
                <ResponsiveContainer className={"GraphView"} width="100%" aspect={ 1.5 }>
                    <LineChart data={ data }
                        margin={{ top: 10, right: 100, left: 100, bottom: 200 }}>      
                        <Line yAxisId="left" dataKey="temp" stroke="#61dafb" dot={ false } />
                        <YAxis yAxisId="left" stroke="#61dafb" domain={ getYAxisRange("temp") } /> 
                        <Line yAxisId="right" stroke="#BADBED" type="monotone" dataKey="rh" dot={ false } />
                        <YAxis yAxisId="right" stroke="#BADBED" domain={ getYAxisRange("rh") } orientation={ "right" } /> 
                        <Tooltip content={ <CustomTooltip /> } cursor={{ fill: "transparent" }} />
                        <Legend layout="horizontal" verticalAlign="top" align="center" />
                        <XAxis dataKey="timestamp" stroke="#BADBED"
                            angle={ -45 } 
                            textAnchor="end" 
                            tickFormatter={convertTimestamp}/>
                    </LineChart>
                </ResponsiveContainer>
                :
                // If we're in list view
                <ul className='ListView'>
                    {data.map((data) => (
                      <li className='ListItem' key={data.timestamp}>
                        <div>{convertTimestamp(data.timestamp)}</div>
                        <div>{data.temp}°F {data.rh}%RH</div>
                      </li>
                      )
                      )}
                </ul>
            }
        </>
        }
    </>);
};
