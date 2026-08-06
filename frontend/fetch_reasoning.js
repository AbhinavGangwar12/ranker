import Papa from "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm";

const csvUrl = "https://huggingface.co/datasets/TIGER-Lab/mmlu_pro_leaderboard_submission/resolve/main/results.csv";

// Color gradients and icons for visual styling in the UI
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
        const response = await fetch(csvUrl);
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                complete: function(results) {
                    const validModels = results.data.filter(row => row.Models || row.Model);
                    
                    // Sort descending by Overall score
                    validModels.sort((a, b) => (b.Overall || 0) - (a.Overall || 0));
                    
                    const top10 = validModels.slice(0, 10).map((model, index) => {
                        const rawScore = model.Overall || 0;
                        return {
                            Rank: index + 1,
                            Name: model.Models || model.Model || "Unknown",
                            DataSource: model.DataSource || "TIGER-Lab",
                            // Context: model.Context || "N/A",
                            Score: typeof rawScore === "number" ? rawScore.toFixed(2) * 100 : rawScore,
                            scoreNum: typeof rawScore === "number" ? rawScore * 100 : 0,
                            color: colors[index % colors.length],
                            icon: icons[index % icons.length]
                        };
                    });
                    
                    resolve(top10);
                },
                error: function(err) {
                    reject(err);
                }
            });
        });
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        return [];
    }
}