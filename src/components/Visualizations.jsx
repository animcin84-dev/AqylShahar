import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';

export const HealthRadar = ({ data }) => {
  // Format data for radar
  const radarData = [
    { subject: 'Экология', A: 100 - (data.ecology?.almalyAQI / 2 || 0), fullMark: 100 },
    { subject: 'Сейсмика', A: 100 - (data.seismic?.maxQuakeMag * 20 || 0), fullMark: 100 },
    { subject: 'Энергетика', A: 100 - (data.advanced?.powerLoad || 0), fullMark: 100 },
    { subject: 'Транспорт', A: 100 - (data.transport?.alfarabi || 0), fullMark: 100 },
    { subject: 'ЖКХ', A: data.jkh?.completion || 0, fullMark: 100 },
  ];

  return (
    <div style={{ width: '100%', height: '180px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="City" dataKey="A" stroke="#00d2ff" fill="#00d2ff" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TrendLine = ({ dataKey = "value", data = [], color = "#00d2ff" }) => {
  return (
    <div style={{ width: '80px', height: '30px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
