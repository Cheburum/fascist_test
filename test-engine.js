// Максимальные возможные баллы для нормализации
const maxScores = {
    TRAD: 42, // 3 * 14 вопросов
    IRRA: 42,
    TRIB: 42,
    AUTH: 42,
    ELIT: 42
};

// Идеологические профили для сравнения
const ideologyProfiles = {
    fascism: {
        name: "Классический фашизм",
        scores: { TRAD: 0.8, IRRA: 0.9, TRIB: 0.9, AUTH: 0.9, ELIT: 0.7 }
    },
    leftAuth: {
        name: "Левый авторитаризм",
        scores: { TRAD: -0.3, IRRA: 0.8, TRIB: 0.7, AUTH: 0.8, ELIT: 0.5 }
    },
    darkEnlightenment: {
        name: "Темное Просвещение",
        scores: { TRAD: 0.4, IRRA: -0.5, TRIB: 0.6, AUTH: 0.5, ELIT: 0.9 }
    },
    ancap: {
        name: "Анархо-капитализм",
        scores: { TRAD: 0.3, IRRA: 0.2, TRIB: -0.4, AUTH: -0.6, ELIT: 0.6 }
    },
    liberalConservatism: {
        name: "Либеральный консерватизм",
        scores: { TRAD: 0.7, IRRA: -0.1, TRIB: 0.5, AUTH: 0.2, ELIT: 0.4 }
    },
    pluralism: {
        name: "Плюрализм",
        scores: { TRAD: -0.5, IRRA: -0.7, TRIB: -0.9, AUTH: -0.8, ELIT: -0.8 }
    }
};

// Переменные состояния
let currentQuestionIndex = 0;
let answers = new Array(questions.length).fill(null);
let scores = { TRAD: 0, IRRA: 0, TRIB: 0, AUTH: 0, ELIT: 0 };
let radarChart = null;

// DOM элементы
const startBtn = document.getElementById('start-btn');
const testIntro = document.getElementById('test-intro');
const testContainer = document.getElementById('test-container');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const resultsContainer = document.getElementById('results');
const overallResult = document.getElementById('overall-result');
const profileAnalysis = document.getElementById('profile-analysis');
const ideologyMatches = document.getElementById('ideology-matches');
const blindSpots = document.getElementById('blind-spots');
const restartBtn = document.getElementById('restart-btn');

// Обработчики событий
startBtn.addEventListener('click', startTest);
prevBtn.addEventListener('click', goToPreviousQuestion);
nextBtn.addEventListener('click', goToNextQuestion);
restartBtn.addEventListener('click', restartTest);

// Функция начала теста
function startTest() {
    testIntro.style.display = 'none';
    testContainer.style.display = 'block';
    updateQuestion();
}

// Функция рестарта теста
function restartTest() {
    currentQuestionIndex = 0;
    answers = new Array(questions.length).fill(null);
    scores = { TRAD: 0, IRRA: 0, TRIB: 0, AUTH: 0, ELIT: 0 };
    resultsContainer.style.display = 'none';
    testContainer.style.display = 'block';
    if (radarChart) {
        radarChart.destroy();
        radarChart = null;
    }
    updateQuestion();
}

// Обновление отображения вопроса
function updateQuestion() {
    const question = questions[currentQuestionIndex];
    questionText.textContent = question.text;

    // Очищаем контейнер с вариантами ответов
    optionsContainer.innerHTML = '';

    // Создаём варианты ответов
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        if (answers[currentQuestionIndex] === index) {
            optionElement.classList.add('selected');
        }
        optionElement.textContent = option.text;
        optionElement.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionElement);
    });

    // Обновляем состояние кнопок и прогресс-бара
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.textContent = currentQuestionIndex === questions.length - 1 ? 'Завершить' : 'Далее';
    nextBtn.disabled = answers[currentQuestionIndex] === null;

    // Обновляем прогресс-бар
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// Выбор варианта ответа
function selectOption(optionIndex) {
    answers[currentQuestionIndex] = optionIndex;

    // Обновляем внешний вид опций
    const optionElements = optionsContainer.querySelectorAll('.option');
    optionElements.forEach((el, index) => {
        if (index === optionIndex) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    });

    // Разблокируем кнопку "Далее"
    nextBtn.disabled = false;
}

// Переход к предыдущему вопросу
function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        updateQuestion();
    }
}

// Переход к следующему вопросу
function goToNextQuestion() {
    if (answers[currentQuestionIndex] === null) {
        return; // Пропускаем, если нет ответа
    }

    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        updateQuestion();
    } else {
        calculateResults();
        showResults();
    }
}

// Подсчёт результатов
function calculateResults() {
    // Сбрасываем счётчики
    scores = { TRAD: 0, IRRA: 0, TRIB: 0, AUTH: 0, ELIT: 0 };

    // Суммируем баллы по ответам
    answers.forEach((answer, questionIndex) => {
        if (answer !== null) {
            const selectedOption = questions[questionIndex].options[answer];
            for (const [key, value] of Object.entries(selectedOption.score)) {
                scores[key] += value;
            }
        }
    });
}

// Нормализация результатов от -1 до 1
function normalizeScores(scores) {
    const normalizedScores = {};
    for (const [key, value] of Object.entries(scores)) {
        normalizedScores[key] = value / maxScores[key];
    }
    return normalizedScores;
}

// Вычисление сходства с идеологическими профилями
function calculateIdeologySimilarity(normalizedScores) {
    const similarity = {};

    for (const [ideology, profile] of Object.entries(ideologyProfiles)) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (const dimension of ['TRAD', 'IRRA', 'TRIB', 'AUTH', 'ELIT']) {
            dotProduct += normalizedScores[dimension] * profile.scores[dimension];
            normA += normalizedScores[dimension] * normalizedScores[dimension];
            normB += profile.scores[dimension] * profile.scores[dimension];
        }

        // Косинусное сходство от -1 до 1, преобразуем в проценты от 0 до 100
        similarity[ideology] = ((dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) + 1) / 2) * 100;
    }

    return similarity;
}

// Создание радарной диаграммы
function createRadarChart(normalizedScores) {
    const ctx = document.getElementById('radar-chart').getContext('2d');

    if (radarChart) {
        radarChart.destroy();
    }

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Традиционализм',
                'Иррационализм',
                'Трайбализм',
                'Авторитаризм',
                'Элитизм'
            ],
            datasets: [{
                label: 'Ваш профиль',
                data: [
                    normalizedScores.TRAD,
                    normalizedScores.IRRA,
                    normalizedScores.TRIB,
                    normalizedScores.AUTH,
                    normalizedScores.ELIT
                ],
                backgroundColor: 'rgba(93, 64, 55, 0.2)',
                borderColor: 'rgba(93, 64, 55, 0.8)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(93, 64, 55, 1)',
                pointRadius: 4
            }]
        },
        options: {
            scales: {
                r: {
                    min: -1,
                    max: 1,
                    ticks: {
                        stepSize: 0.5,
                        showLabelBackdrop: false,
                        color: '#333',
                        font: {
                            size: 10
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.r.toFixed(2);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Генерация HTML для идеологической близости
function createIdeologyMatchesHTML(similarity) {
    const sortedIdeologies = Object.entries(similarity)
        .sort((a, b) => b[1] - a[1]);

    let html = '';

    sortedIdeologies.forEach(([ideologyKey, percent]) => {
        const ideology = ideologyProfiles[ideologyKey];
        html += `
            <div class="ideology-match">
                <div class="ideology-name">${ideology.name}</div>
                <div class="ideology-bar-container">
                    <div class="ideology-bar" style="width: ${percent}%"></div>
                </div>
                <div class="ideology-percent">${Math.round(percent)}%</div>
            </div>
        `;
    });

    return html;
}

// Создание анализа профиля
function createProfileAnalysis(normalizedScores) {
    let highestDimension = null;
    let highestValue = -Infinity;
    let lowestDimension = null;
    let lowestValue = Infinity;

    const dimensionNames = {
        TRAD: "традиционализм",
        IRRA: "иррационализм",
        TRIB: "трайбализм",
        AUTH: "авторитаризм",
        ELIT: "элитизм"
    };

    for (const [dimension, value] of Object.entries(normalizedScores)) {
        if (value > highestValue) {
            highestValue = value;
            highestDimension = dimension;
        }
        if (value < lowestValue) {
            lowestValue = value;
            lowestDimension = dimension;
        }
    }

    let analysis = '';

    if (highestValue > 0.5) {
        analysis += `Наиболее выраженное измерение вашего профиля — <strong>${dimensionNames[highestDimension]}</strong> (${(highestValue * 100).toFixed(0)}%). `;

        if (highestDimension === 'TRAD') {
            analysis += 'Вы высоко цените традиции, историческое наследие и устоявшиеся ценности. ';
        } else if (highestDimension === 'IRRA') {
            analysis += 'Вы склонны отдавать предпочтение действию и эмоциональному отклику над рациональным анализом. ';
        } else if (highestDimension === 'TRIB') {
            analysis += 'В вашем мышлении важное место занимает деление на "своих" и "чужих", вы высоко цените групповую идентичность. ';
        } else if (highestDimension === 'AUTH') {
            analysis += 'Вы склонны ценить иерархию, сильное руководство и дисциплину для поддержания порядка. ';
        } else if (highestDimension === 'ELIT') {
            analysis += 'Вы считаете естественным и правильным неравенство в способностях и властных отношениях. ';
        }
    }

    if (lowestValue < -0.5) {
        analysis += `Наименее выраженное измерение — <strong>${dimensionNames[lowestDimension]}</strong> (${(lowestValue * 100).toFixed(0)}%). `;

        if (lowestDimension === 'TRAD') {
            analysis += 'Вы скептически относитесь к традициям и историческим авторитетам. ';
        } else if (lowestDimension === 'IRRA') {
            analysis += 'Вы высоко цените рациональность и критическое мышление. ';
        } else if (lowestDimension === 'TRIB') {
            analysis += 'Вы не склонны делить мир на "своих" и "чужих", предпочитая универсалистский подход. ';
        } else if (lowestDimension === 'AUTH') {
            analysis += 'Вы противостоите авторитарным тенденциям и цените горизонтальные отношения. ';
        } else if (lowestDimension === 'ELIT') {
            analysis += 'Вы придерживаетесь эгалитарного подхода и не поддерживаете иерархические структуры. ';
        }
    }

    // Общая оценка профиля
    const averageScore = Object.values(normalizedScores).reduce((sum, val) => sum + val, 0) / 5;

    if (averageScore > 0.5) {
        analysis += 'В целом ваш профиль демонстрирует значительные авторитарные тенденции. ';
    } else if (averageScore > 0.2) {
        analysis += 'В целом ваш профиль содержит умеренные авторитарные тенденции. ';
    } else if (averageScore > -0.2) {
        analysis += 'В целом ваш профиль сбалансирован между авторитарными и антиавторитарными тенденциями. ';
    } else if (averageScore > -0.5) {
        analysis += 'В целом ваш профиль демонстрирует умеренные антиавторитарные тенденции. ';
    }

    return analysis;
}

// Генерация "слепых пятен"
function createBlindSpots(normalizedScores, ideologySimilarity) {
    let blindSpots = '';

    // Находим наиболее близкую идеологию
    let closestIdeology = null;
    let highestSimilarity = -Infinity;

    for (const [ideology, similarity] of Object.entries(ideologySimilarity)) {
        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            closestIdeology = ideology;
        }
    }

    // Анализируем "слепые пятна" в зависимости от идеологической близости
    if (closestIdeology === 'fascism' && highestSimilarity > 70) {
        blindSpots = 'Вы можете не замечать, как ваше стремление к культурному единству и коллективной идентичности может вести к подавлению индивидуальных свобод и исключению тех, кто не вписывается в ваше представление о "своих". Обратите внимание на ценность разнообразия и важность прав меньшинств.';
    } else if (closestIdeology === 'leftAuth' && highestSimilarity > 70) {
        blindSpots = 'Вы можете не замечать, как ваше стремление к экономической справедливости может перерасти в авторитарные методы её достижения. Помните, что средства достижения цели так же важны, как и сама цель, а принуждение ради благих намерений часто ведёт к неблагим последствиям.';
    } else if (closestIdeology === 'darkEnlightenment' && highestSimilarity > 70) {
        blindSpots = 'Вы можете не замечать, как ваша критика демократических институтов и поддержка "естественных иерархий" может приводить к дегуманизации тех, кого вы считаете менее способными. Обратите внимание на ценность человеческого достоинства вне зависимости от когнитивных способностей.';
    } else if (closestIdeology === 'ancap' && highestSimilarity > 70) {
        blindSpots = 'Вы можете не замечать, как ваше стремление к абсолютной экономической свободе может приводить к новым формам принуждения и зависимости для тех, кто находится в уязвимом положении. Обратите внимание на то, как неравное распределение ресурсов влияет на реальную свободу выбора.';
    } else if (closestIdeology === 'liberalConservatism' && highestSimilarity > 70) {
        blindSpots = 'Вы можете не замечать, как ваше уважение к традициям и устоявшимся институтам может приводить к сохранению исторических форм неравенства. Обратите внимание на то, как консерватизм может незаметно перерастать в сопротивление необходимым социальным переменам.';
    } else if (closestIdeology === 'pluralism' && highestSimilarity > 70) {
        blindSpots = 'Вы можете не замечать, как ваше стремление к равенству и инклюзивности может иногда игнорировать реальные культурные различия и конфликты ценностей. Обратите внимание на то, как чрезмерный релятивизм может затруднять формирование общих принципов, необходимых для общества.';
    } else if (normalizedScores.TRAD > 0.5) {
        blindSpots = 'Ваше сильное предпочтение традиций может затруднять восприятие необходимых социальных изменений и адаптацию к новым реалиям. Помните, что не все традиции одинаково ценны, а некоторые исторические практики могут поддерживать несправедливые отношения.';
    } else if (normalizedScores.IRRA > 0.5) {
        blindSpots = 'Ваше предпочтение действию и интуиции перед рефлексией может приводить к поспешным решениям и игнорированию долгосрочных последствий. Помните о ценности критического мышления и анализа, особенно в сложных ситуациях.';
    } else if (normalizedScores.TRIB > 0.5) {
        blindSpots = 'Ваша склонность к групповому мышлению и делению на "своих" и "чужих" может затруднять понимание общечеловеческих ценностей и приводить к необоснованной враждебности. Помните, что групповые границы часто произвольны и социально сконструированы.';
    } else if (normalizedScores.AUTH > 0.5) {
        blindSpots = 'Ваше предпочтение иерархии и сильного руководства может приводить к недооценке важности горизонтальных связей и демократического процесса. Помните, что концентрация власти часто ведёт к злоупотреблениям и ошибкам, даже при благих намерениях.';
    } else if (normalizedScores.ELIT > 0.5) {
        blindSpots = 'Ваше принятие естественности неравенства может приводить к оправданию несправедливых социальных условий и системного неравенства возможностей. Помните, что многие "естественные" различия на самом деле формируются социальной средой и доступом к ресурсам.';
    } else {
        blindSpots = 'Ваш профиль достаточно сбалансирован, но помните, что любая позиция имеет свои ограничения. Старайтесь рассматривать вопросы с разных перспектив и учитывать разнообразие человеческого опыта при формировании своих убеждений.';
    }

    return blindSpots;
}

// Отображение результатов
function showResults() {
    testContainer.style.display = 'none';
    resultsContainer.style.display = 'block';

    const normalizedScores = normalizeScores(scores);
    const similarity = calculateIdeologySimilarity(normalizedScores);

    overallResult.textContent = `Общий уровень авторитарных тенденций: ${Object.values(normalizedScores).reduce((sum, val) => sum + val, 0).toFixed(2)}`;
    profileAnalysis.innerHTML = createProfileAnalysis(normalizedScores);
    ideologyMatches.innerHTML = createIdeologyMatchesHTML(similarity);
    blindSpots.innerHTML = createBlindSpots(normalizedScores, similarity);

    createRadarChart(normalizedScores);
}
