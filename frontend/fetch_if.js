// We fetch the top 100 models from the Open LLM Leaderboard contents dataset
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

export async function fetchTopModels() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch Hugging Face leaderboard data.");
        
        const data = await response.json();
        
        // Extract the inner 'row' object from the API response
        const models = data.rows.map(item => item.row);
        
        // Sort models descending specifically by their IFEval score
        models.sort((a, b) => {
            // We use a fallback OR statement just in case Hugging Face updates the column name slightly
            const scoreA = a["IFEval"] || a["IFEval ⬆️"] || 0;
            const scoreB = b["IFEval"] || b["IFEval ⬆️"] || 0;
            return scoreB - scoreA;
        });
        
        // Grab top 10 and map to your UI format
        const top10 = models.slice(0, 10).map((model, index) => {
            const rawScore = model["IFEval"] || model["IFEval ⬆️"] || 0;
            
            return {
                Rank: index + 1,
                // Name: model["Model"] || "Unknown",
                Name: model["Model"] || "Unknown",
                // Extracting model type (e.g., 'fine-tuned', 'base', 'chat')
                DataSource: model["Type"] || "Open Weights", 
                Score: typeof rawScore === "number" ? rawScore.toFixed(2) : rawScore,
                scoreNum: typeof rawScore === "number" ? rawScore : 0,
                color: colors[index % colors.length],
                icon: icons[index % icons.length]
            };
        });
        // console.log("Top 10 Instruction Following Models:", top10); // Debugging: Log the top 10 models to the console
        return top10;
    } catch (error) {
        console.error("Error fetching IFEval leaderboard:", error);
        return [];
    }
}
// fetchTopModels();   