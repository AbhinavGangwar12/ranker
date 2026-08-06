const apiUrl = "https://huggingface.co/api/datasets/openai/gsm8k/leaderboard";
const colors = [
    "from-green-500 to-emerald-700",
    "from-orange-400 to-red-500",
    "from-blue-400 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600"
]

const icons = ["fa-brain", "fa-robot", "fa-sparkles", "fa-cube", "fa-wind", "fa-server"];

export async function fetchTopModels(){
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const top10 = data.slice(0, 10).map((model, index) => {
            const rawScore = model.value || 0;
            return {
                Rank: model.rank || index + 1,
                Name: model.author.name || "Unknown",
                DataSource: model.data_source || "GSM8K",
                Score: typeof rawScore === "number" ? rawScore.toFixed(2) : rawScore,
                scoreNum: typeof rawScore === "number" ? rawScore : 0,
                color: colors[index % colors.length],
                icon: icons[index % icons.length]
            };
        });
        return top10;
    }
    catch (error){
        console.error("Error fetching or parsing:", error);
        return [];
    }
}