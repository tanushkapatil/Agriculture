document.addEventListener('DOMContentLoaded', function() {
    // Update slider values in real-time
    updateSliderValues();
    
    // Setup event listeners for crop recommendation form
    document.getElementById('cropForm').addEventListener('submit', function(e) {
        e.preventDefault();
        getCropRecommendation();
    });
    
    // Setup event listeners for fertilizer recommendation form
    document.getElementById('fertilizerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        getFertilizerRecommendation();
    });
    
    // Setup slider value displays
    setupSliders();
});

function updateSliderValues() {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const valueSpan = document.getElementById(`${slider.id}Value`);
        if (valueSpan) {
            valueSpan.textContent = slider.value;
        }
    });
}

function setupSliders() {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        slider.addEventListener('input', function() {
            const valueSpan = document.getElementById(`${this.id}Value`);
            if (valueSpan) {
                valueSpan.textContent = this.value;
            }
        });
    });
}

function getCropRecommendation() {
    const N = document.getElementById('N').value;
    const P = document.getElementById('P').value;
    const K = document.getElementById('K').value;
    const temperature = document.getElementById('temperature').value;
    const humidity = document.getElementById('humidity').value;
    const ph = document.getElementById('ph').value;
    const rainfall = document.getElementById('rainfall').value;
    
    const data = {
        N: N,
        P: P,
        K: K,
        temperature: temperature,
        humidity: humidity,
        ph: ph,
        rainfall: rainfall
    };
    
    fetch('/recommend_crop', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        displayCropResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('cropResults').innerHTML = `
            <div class="alert alert-danger">
                Error getting recommendation: ${error.message}
            </div>
        `;
    });
}

function displayCropResults(data) {
    const cropResults = document.getElementById('cropResults');
    
    if (data.error) {
        cropResults.innerHTML = `
            <div class="alert alert-danger">
                ${data.error}
            </div>
        `;
        return;
    }
    
    let html = `
        <h4>Top Recommendation</h4>
        <div class="recommendation-item top-recommendation">
            <h5>${data.top_recommendation}</h5>
            <p>Probability: ${(data.recommendations[0].probability * 100).toFixed(2)}%</p>
        </div>
        
        <h4 class="mt-4">Other Suitable Crops</h4>
    `;
    
    data.recommendations.slice(1).forEach(item => {
        html += `
            <div class="recommendation-item">
                <h5>${item.crop}</h5>
                <p>Probability: ${(item.probability * 100).toFixed(2)}%</p>
            </div>
        `;
    });
    
    cropResults.innerHTML = html;
    
    // Show fertilizer section with the top crop pre-selected
    document.getElementById('fertilizerResults').style.display = 'block';
    document.getElementById('cropType').value = data.top_recommendation;
    
    // Update nutrient chart
    updateNutrientChart(N, P, K);
}

function getFertilizerRecommendation() {
    const temperature = document.getElementById('fTemperature').value;
    const humidity = document.getElementById('fHumidity').value;
    const moisture = document.getElementById('fMoisture').value;
    const soilType = document.getElementById('soilType').value;
    const cropType = document.getElementById('cropType').value;
    const N = document.getElementById('fN').value;
    const P = document.getElementById('fP').value;
    const K = document.getElementById('fK').value;
    
    const data = {
        temperature: temperature,
        humidity: humidity,
        moisture: moisture,
        soil_type: soilType,
        crop_type: cropType,
        N: N,
        P: P,
        K: K
    };
    
    fetch('/recommend_fertilizer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        displayFertilizerResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('fertilizerContent').innerHTML = `
            <div class="alert alert-danger">
                Error getting recommendation: ${error.message}
            </div>
        `;
    });
}

function displayFertilizerResults(data) {
    const fertilizerContent = document.getElementById('fertilizerContent');
    
    if (data.error) {
        fertilizerContent.innerHTML = `
            <div class="alert alert-danger">
                ${data.error}
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="alert alert-success">
            <h4 class="alert-heading">Recommended Fertilizer</h4>
            <p class="fertilizer-recommendation">${data.fertilizer}</p>
        </div>
    `;
    
    if (data.deficiencies && data.deficiencies.length > 0) {
        html += `
            <div class="alert alert-warning">
                <h5 class="alert-heading">Nutrient Deficiencies Detected</h5>
                <ul>
        `;
        
        data.deficiencies.forEach(def => {
            html += `<li class="deficiency-item">${def}</li>`;
        });
        
        html += `
                </ul>
                <p>The recommended fertilizer will help address these deficiencies.</p>
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-info">
                <p>No significant nutrient deficiencies detected. The recommended fertilizer will help maintain soil health.</p>
            </div>
        `;
    }
    
    fertilizerContent.innerHTML = html;
    
    // Update nutrient chart with fertilizer data
    updateNutrientChart(data.soil_health.N, data.soil_health.P, data.soil_health.K);
}

function updateNutrientChart(N, P, K) {
    const ctx = document.getElementById('nutrientChart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (window.nutrientChart) {
        window.nutrientChart.destroy();
    }
    
    // Ideal levels (for reference)
    const idealN = 40;
    const idealP = 30;
    const idealK = 40;
    
    window.nutrientChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)'],
            datasets: [
                {
                    label: 'Current Levels',
                    data: [N, P, K],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 206, 86, 0.7)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1
                },
                {
                    label: 'Ideal Levels',
                    data: [idealN, idealP, idealK],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.3)',
                        'rgba(255, 99, 132, 0.3)',
                        'rgba(255, 206, 86, 0.3)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1,
                    type: 'line',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Level (kg/ha)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Soil Nutrient Levels vs Ideal'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.raw;
                            if (context.datasetIndex === 1) {
                                label += ' (Ideal)';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    
    document.getElementById('nutrientChartContainer').style.display = 'block';
}