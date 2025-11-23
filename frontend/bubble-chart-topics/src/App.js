import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import Papa from 'papaparse';
import { Upload, Info } from 'lucide-react';

export default function BubbleChartTopics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const processCSV = (file) => {
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const rows = results.data;

        // Agrupar por tema
        const topicsMap = {};

        rows.forEach(row => {
          const topic = row.BERTopic_Topic !== undefined ? row.BERTopic_Topic : 'Sin tema';
          const lang = row.Lang ? row.Lang.trim().toUpperCase() : '';
          const sentiment = parseFloat(row.SentimentScore);

          if (!topicsMap[topic]) {
            topicsMap[topic] = {
              topic: topic,
              total: 0,
              langA: 0,
              langE: 0,
              sentimentSum: 0,
              sentimentCount: 0
            };
          }

          topicsMap[topic].total++;

          if (lang === 'A') topicsMap[topic].langA++;
          if (lang === 'E') topicsMap[topic].langE++;

          if (!isNaN(sentiment)) {
            topicsMap[topic].sentimentSum += sentiment;
            topicsMap[topic].sentimentCount++;
          }
        });

        // Convertir a array y calcular promedios
        const processedData = Object.values(topicsMap).map((item, index) => ({
          topic: `Tema ${item.topic}`,
          topicId: item.topic,
          yPosition: index + 1,
          total: item.total,
          langA: item.langA,
          langE: item.langE,
          avgSentiment: item.sentimentCount > 0
            ? item.sentimentSum / item.sentimentCount
            : 0,
          propA: item.total > 0 ? (item.langA / item.total) * 100 : 0
        })).sort((a, b) => a.avgSentiment - b.avgSentiment);

        setData(processedData);
        setStats({
          totalTopics: processedData.length,
          totalTweets: rows.length
        });
        setLoading(false);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setLoading(false);
      }
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processCSV(file);
    }
  };

  const getColor = (propA) => {
    // Color basado en proporción de Lang A
    if (propA > 66) return '#10b981'; // Verde (más A)
    if (propA > 33) return '#f59e0b'; // Naranja (balance)
    return '#ef4444'; // Rojo (más E)
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800 mb-2">{data.topic}</p>
          <p className="text-sm text-gray-600">Total tweets: <span className="font-semibold">{data.total}</span></p>
          <p className="text-sm text-gray-600">Lang A: <span className="font-semibold">{data.langA}</span></p>
          <p className="text-sm text-gray-600">Lang E: <span className="font-semibold">{data.langE}</span></p>
          <p className="text-sm text-gray-600">Sentiment promedio: <span className="font-semibold">{data.avgSentiment.toFixed(3)}</span></p>
          <p className="text-sm text-gray-600">% Lang A: <span className="font-semibold">{data.propA.toFixed(1)}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Análisis de Topics por Sentiment</h1>
        <p className="text-gray-600 mb-6">Bubble Chart interactivo de temas y sentimientos</p>

        {!data.length ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Cargar archivo CSV</h2>
            <p className="text-gray-600 mb-6">
              Sube tu archivo con las columnas: Fecha, Hora, Likes, Lang, Tweet_limpio,
              Procesado, BERTopic_Topic, BERTopic_Prob, Locations, SentimentScore
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
              <span className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                {loading ? 'Procesando...' : 'Seleccionar archivo'}
              </span>
            </label>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Topics</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalTopics}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Tweets</h3>
                <p className="text-3xl font-bold text-green-600">{stats.totalTweets}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Rango Sentiment</h3>
                <p className="text-3xl font-bold text-purple-600">-1 a +1</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
              <div className="flex items-start gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Cómo leer el gráfico:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Eje X:</strong> Sentiment Score promedio (-1=negativo, +1=positivo)</li>
                    <li><strong>Tamaño:</strong> Cantidad total de tweets por tema</li>
                    <li><strong>Color:</strong> Verde (más Lang A), Naranja (balance), Rojo (más Lang E)</li>
                  </ul>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    dataKey="avgSentiment"
                    name="Sentiment"
                    domain={[-1, 1]}
                    label={{ value: 'Sentiment Score Promedio', position: 'bottom', offset: 40 }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    type="number"
                    dataKey="yPosition"
                    name="Tema"
                    domain={[0, 'dataMax + 1']}
                    tick={false}
                    label={{ value: 'Topics', angle: -90, position: 'left', offset: 40 }}
                    stroke="#6b7280"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    content={() => (
                      <div className="flex justify-center gap-6 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-500"></div>
                          <span className="text-sm">Más Lang A</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                          <span className="text-sm">Balance A/E</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-500"></div>
                          <span className="text-sm">Más Lang E</span>
                        </div>
                      </div>
                    )}
                  />
                  <Scatter data={data} fill="#8884d8">
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColor(entry.propA)}
                        fillOpacity={0.7}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 max-h-96 overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Detalle por Tema</h3>
              <div className="space-y-3">
                {data.map((item, idx) => (
                  <div key={idx} className="border-l-4 pl-4 py-2" style={{ borderColor: getColor(item.propA) }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{item.topic}</p>
                        <p className="text-sm text-gray-600">
                          Total: {item.total} tweets | Lang A: {item.langA} | Lang E: {item.langE}
                        </p>
                      </div>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {item.avgSentiment.toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setData([]);
                setStats(null);
              }}
              className="mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Cargar otro archivo
            </button>
          </>
        )}
      </div>
    </div>
  );
}