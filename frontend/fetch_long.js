// // We fetch from the Open LLM Leaderboard contents dataset, just like we did for IFEval
// const apiUrl = "https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard/contents&config=default&split=train&offset=0&length=100";

// const colors = [
//     "from-green-500 to-emerald-700",
//     "from-orange-400 to-red-500",
//     "from-blue-400 to-indigo-600",
//     "from-purple-500 to-pink-600",
//     "from-amber-500 to-orange-600",
//     "from-cyan-500 to-blue-600"
// ];

// const icons = ["fa-brain", "fa-robot", "fa-sparkles", "fa-cube", "fa-wind", "fa-server"];

// export async function fetchTopModels() {
//     try {
//         const response = await fetch(apiUrl);
//         if (!response.ok) throw new Error("Failed to fetch Hugging Face leaderboard data.");
        
//         const data = await response.json();
        
//         // Extract the inner 'row' object from the API response
//         const models = data.rows.map(item => item.row);
        
//         // Filter out models that don't have a LongBench score, then sort them
//         const validModels = models.filter(m => m["LongBench"] !== null && m["LongBench"] !== undefined);
        
//         validModels.sort((a, b) => {
//             // Check for potential Hugging Face column name variations
//             const scoreA = a["LongBench"] || a["LongBench ⬆️"] || 0;
//             const scoreB = b["LongBench"] || b["LongBench ⬆️"] || 0;
//             return scoreB - scoreA;
//         });
        
//         // Grab top 10 and map to your UI format
//         const top10 = validModels.slice(0, 10).map((model, index) => {
//             const rawScore = model["LongBench"] || model["LongBench ⬆️"] || 0;
            
//             return {
//                 Rank: index + 1,
//                 Name: model["Model"] || "Unknown",
//                 DataSource: model["Type"] || "Open Weights", 
//                 Score: typeof rawScore === "number" ? rawScore.toFixed(2) : rawScore,
//                 scoreNum: typeof rawScore === "number" ? rawScore : 0,
//                 color: colors[index % colors.length],
//                 icon: icons[index % icons.length]
//             };
//         });
        
//         return top10;
//     } catch (error) {
//         console.error("Error fetching LongBench leaderboard:", error);
//         return [];
//     }
// }


// Fetch up to 100 rows from the Open LLM Leaderboard
const apiUrl = "https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard/contents&config=default&split=train&offset=0&length=100";

const colors = [
    "from-green-500 to-emerald-700",
    "from-orange-400 to-red-500",
    "from-blue-400 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600"
];

const icons = ["fa-brain", "fa-robot", "fa-sparkles", "fa-cube", "fa-wind", "fa-server"];

/**
 * Fetches top 10 models for a specified metric key in the schema
 * @param {string} metricKey - Key name e.g., "MMLU-PRO", "IFEval", "GPQA", "MATH Lvl 5", or "Average ⬆️"
 */
export async function fetchTopModels(metricKey = "MMLU-PRO") {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch leaderboard data.");
        
        const data = await response.json();
        const rawRows = data.rows || [];

        // 1. Extract the inner 'row' payload from each item
        const models = rawRows.map(item => item.row);

        // 2. Filter out items where the chosen metric is missing/null
        const validModels = models.filter(m => typeof m[metricKey] === "number");

        // 3. Sort descending by the target metric
        validModels.sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0));

        // 4. Slice top 10 and map to your UI format
        const top10 = validModels.slice(0, 10).map((model, index) => {
            const rawScore = model[metricKey] || 0;
            const params = model["#Params (B)"] ? `${model["#Params (B)"]}B` : "N/A";

            return {
                Rank: index + 1,
                Name: model.fullname || "Unknown Model", // Clean model string without HTML
                DataSource: model.Type || "Open Weights",
                Context: params, // Displays parameter size in the table context column
                Score: rawScore.toFixed(2),
                scoreNum: rawScore,
                color: colors[index % colors.length],
                icon: icons[index % icons.length]
            };
        });

        return top10;
    } catch (error) {
        console.error(`Error fetching leaderboard for ${metricKey}:`, error);
        return [];
    }
}