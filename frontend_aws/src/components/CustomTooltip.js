// For displaying the mouse-over interactivity label on the historical data plot

export const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <div className="label">{`${label}`}</div>
          <div>
            {payload.map((pld) => (
              <div style={{ display: "inline-block", padding: 6 }}>
                {// Appends degF or % depending on which value is being displayed.
                (pld.dataKey === "rh") ?   
                  <div style={{ color: pld.fill }}>{pld.value}%</div>
                  :
                  <div style={{ color: pld.fill }}>{pld.value}°F</div>
                }              
                <div>{pld.dataKey}</div>
              </div>))}
          </div>
        </div>
      );
    }

    return null;
};
