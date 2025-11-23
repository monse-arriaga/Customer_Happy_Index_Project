import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Papa from 'papaparse';
import { Upload, X, Mail, Twitter } from 'lucide-react';

export default function TopicAnalysis() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [sourceData, setSourceData] = useState([]);

  const processCSV = (file) => {
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const rows = results.data;

        // Contar fuentes y lenguajes
        let correoCount = 0;
        let tweetCount = 0;
        let alemanCount = 0;
        let espanolCount = 0;

        rows.forEach(row => {
          if (row.Fuente && row.Fuente.trim().toUpperCase() === 'C') {
            correoCount++;
          } else {
            tweetCount++;
          }

          const lang = row.Lang ? row.Lang.trim().toUpperCase() : '';
          if (lang === 'A') alemanCount++;
          if (lang === 'E') espanolCount++;
        });

        setSourceData([
          { name: 'Correos', value: correoCount, color: '#3b82f6' },
          { name: 'Tweets', value: tweetCount, color: '#10b981' }
        ]);

        const langData = [
          { name: 'Alemán', value: alemanCount, color: '#f59e0b' },
          { name: 'Español', value: espanolCount, color: '#ec4899' }
        ];

        // Agrupar por tema
        const topicsMap = {};

        rows.forEach(row => {
          const topic = row.BERTopic_Topic !== undefined ? row.BERTopic_Topic : 'Sin tema';
          const lang = row.Lang ? row.Lang.trim().toUpperCase() : '';
          const sentiment = parseFloat(row.SentimentScore);

          if (!topicsMap[topic]) {
            // Limpiar keywords: remover corchetes, comillas y espacios extra
            let cleanKeywords = '';
            if (row.BERTopic_Translated_Keywords) {
              cleanKeywords = row.BERTopic_Translated_Keywords
                .replace(/[\[\]'\"]/g, '') // Remover [, ], ', "
                .trim();
            }

            // Inicializar con los datos del primer tweet de este tema
            topicsMap[topic] = {
              topic: topic,
              total: 0,
              langA: 0,
              langE: 0,
              sentimentSum: 0,
              sentimentCount: 0,
              keywords: cleanKeywords,
              repTweet: row.BERTopic_Representative_Tweet_En || '',
              tweets: []
            };
          }

          topicsMap[topic].total++;

          if (lang === 'A') topicsMap[topic].langA++;
          if (lang === 'E') topicsMap[topic].langE++;

          if (!isNaN(sentiment)) {
            topicsMap[topic].sentimentSum += sentiment;
            topicsMap[topic].sentimentCount++;
          }

          // Guardar tweets del tema
          if (row.Tweet_limpio || row.Procesado) {
            topicsMap[topic].tweets.push({
              text: row.Tweet_limpio || row.Procesado || '',
              sentiment: sentiment,
              lang: lang,
              fuente: row.Fuente
            });
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
          propA: item.total > 0 ? (item.langA / item.total) * 100 : 0,
          keywords: item.keywords,
          repTweet: item.repTweet,
          tweets: item.tweets
        })).sort((a, b) => a.avgSentiment - b.avgSentiment);

        setData(processedData);
        setStats({
          totalTopics: processedData.length,
          totalTweets: rows.length,
          totalCorreos: correoCount,
          totalTweetsSource: tweetCount,
          totalAleman: alemanCount,
          totalEspanol: espanolCount,
          langData: langData
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

  const getColorByLang = (langA, langE) => {
    if (langA > langE) return '#f59e0b'; // Naranja para Alemán
    if (langE > langA) return '#ec4899'; // Rosa para Español
    return '#6366f1'; // Índigo si están balanceados
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs">
          <p className="font-bold text-gray-800 mb-2">{d.topic}</p>
          <p className="text-sm text-gray-600">Total tweets: <span className="font-semibold">{d.total}</span></p>
          <p className="text-sm text-gray-600">🇩🇪 Alemán: <span className="font-semibold">{d.langA}</span></p>
          <p className="text-sm text-gray-600">🇪🇸 Español: <span className="font-semibold">{d.langE}</span></p>
          <p className="text-sm text-gray-600">Sentiment: <span className="font-semibold">{d.avgSentiment.toFixed(3)}</span></p>
          <p className="text-xs text-blue-600 mt-2">Click para ver detalles</p>
        </div>
      );
    }
    return null;
  };

  const handleBubbleClick = (data) => {
    setSelectedTopic(data);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Análisis de Topics por Sentiment</h1>
        <p className="text-gray-600 mb-6">Visualización interactiva de clusters y fuentes</p>

        {!data.length ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Cargar archivo CSV</h2>
            <p className="text-gray-600 mb-6">
              Sube tu archivo con las columnas necesarias para el análisis
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Stats */}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Bubble Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Distribución de Clusters</h3>
                <p className="text-sm text-gray-600 mb-2">Click en una burbuja para ver detalles del tema</p>
                <div className="flex gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>🇩🇪 Alemán dominante</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <span>🇪🇸 Español dominante</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span>Balanceado</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
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
                    <Scatter
                      data={data}
                      fill="#6366f1"
                      onClick={handleBubbleClick}
                      className="cursor-pointer"
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getColorByLang(entry.langA, entry.langE)}
                          fillOpacity={selectedTopic?.topicId === entry.topicId ? 1 : 0.7}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Charts Column */}
              <div className="space-y-6">
                {/* Pie Chart - Fuente */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Fuente de Datos</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Correos</span>
                      </div>
                      <span className="font-bold text-blue-600">{stats.totalCorreos}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center gap-2">
                        <Twitter className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Tweets</span>
                      </div>
                      <span className="font-bold text-green-600">{stats.totalTweetsSource}</span>
                    </div>
                  </div>
                </div>

                {/* Pie Chart - Idioma */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Distribución por Idioma</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={stats.langData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.langData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span className="text-sm font-medium">🇩🇪 Alemán</span>
                      <span className="font-bold text-orange-600">{stats.totalAleman}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-pink-50 rounded">
                      <span className="text-sm font-medium">🇪🇸 Español</span>
                      <span className="font-bold text-pink-600">{stats.totalEspanol}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalle del tema seleccionado */}
            {selectedTopic && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-indigo-500">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">{selectedTopic.topic}</h3>
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Estadísticas */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Estadísticas</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Total tweets:</span> {selectedTopic.total}</p>
                      <p><span className="font-medium">🇩🇪 Alemán (A):</span> {selectedTopic.langA} ({((selectedTopic.langA / selectedTopic.total) * 100).toFixed(1)}%)</p>
                      <p><span className="font-medium">🇪🇸 Español (E):</span> {selectedTopic.langE} ({((selectedTopic.langE / selectedTopic.total) * 100).toFixed(1)}%)</p>
                      <p><span className="font-medium">Sentiment promedio:</span> {selectedTopic.avgSentiment.toFixed(3)}</p>
                    </div>
                  </div>

                  {/* Palabras clave */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Palabras Clave</h4>
                    {selectedTopic.keywords ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTopic.keywords.split(',').map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                          >
                            {keyword.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No hay palabras clave disponibles</p>
                    )}
                  </div>
                </div>

                {/* Tweet representativo */}
                {selectedTopic.repTweet && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-700 mb-3">Tweet Representativo</h4>
                    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                      <p className="text-gray-800 italic">"{selectedTopic.repTweet}"</p>
                    </div>
                  </div>
                )}

                {/* Muestra de tweets */}
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Muestra de Tweets ({selectedTopic.tweets.length})</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {selectedTopic.tweets.slice(0, 10).map((tweet, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded text-sm border-l-2 border-gray-300">
                        <p className="text-gray-700">{tweet.text}</p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          <span>Sentiment: {tweet.sentiment?.toFixed(3)}</span>
                          <span>Lang: {tweet.lang}</span>
                          {tweet.fuente === 'C' && <span className="text-blue-600">📧 Correo</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Lista de todos los temas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Todos los Temas</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.map((item, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 pl-4 py-2 hover:bg-gray-50 cursor-pointer transition"
                    style={{ borderLeftColor: getColorByLang(item.langA, item.langE) }}
                    onClick={() => setSelectedTopic(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{item.topic}</p>
                        <p className="text-sm text-gray-600">
                          Total: {item.total} | 🇩🇪 Alemán: {item.langA} | 🇪🇸 Español: {item.langE}
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
                setSelectedTopic(null);
                setSourceData([]);
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