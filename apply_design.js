const fs = require('fs');
const path = require('path');

const cssOverride = `
      body {
        font-family: 'Inter', sans-serif;
        background-color: #000;
        color: #fff;
        margin: 0;
        padding: 20px;
        background-image: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
        overflow-x: hidden;
      }

      /* Aesthetics from ORION */
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        z-index: -1;
        opacity: 0.04;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      }

      h1 {
        font-family: 'Bricolage Grotesque', sans-serif;
        font-size: 2.2rem;
        margin-bottom: 2rem;
        font-weight: 500;
        letter-spacing: -0.02em;
        color: #fff;
      }

      .question-container {
        background-color: rgba(255, 255, 255, 0.02);
        padding: 24px;
        margin-bottom: 24px;
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(16px);
        transition: transform 0.5s ease;
      }

      .question-header {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: #10b981;
        margin-bottom: 25px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 15px;
      }

      .question-description p {
        margin: 5px 0;
        font-size: 1.15rem;
        line-height: 1.6;
        color: rgba(255,255,255,0.8);
      }

      .question-image,
      .question-audio {
        margin: 20px 0;
        text-align: center;
      }

      .question-image img {
        max-width: 100%;
        height: auto;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255,255,255,0.1);
      }

      .options-list {
        list-style: none;
        padding: 0;
        margin-top: 25px;
      }

      .option-item {
        margin: 15px 0;
        padding: 20px 25px;
        background-color: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        transition: all 0.3s ease;
        cursor: pointer;
        color: rgba(255,255,255,0.9);
        display: flex;
        align-items: center;
      }

      .option-item:hover {
        background-color: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateX(8px);
      }

      .option-item input[type='radio'] {
        margin-right: 20px;
        accent-color: #10b981;
        transform: scale(1.4);
        cursor: pointer;
      }

      .correct-answer {
        background-color: rgba(16, 185, 129, 0.15) !important;
        border-color: #10b981 !important;
        color: #10b981 !important;
        transform: scale(1.02);
      }

      .incorrect-selected {
        background-color: rgba(239, 68, 68, 0.15) !important;
        border-color: #ef4444 !important;
        color: #ef4444 !important;
      }

      .correct-not-selected {
        background-color: rgba(245, 158, 11, 0.15) !important;
        border-color: #f59e0b !important;
        color: #f59e0b !important;
      }

      .submit-button {
        display: block;
        width: 100%;
        max-width: 400px;
        margin: 30px auto 0;
        padding: 16px;
        background-color: #fff;
        color: #000;
        border: none;
        border-radius: 9999px;
        font-family: 'Bricolage Grotesque', sans-serif;
        font-size: 1.25em;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        box-shadow: 0 10px 20px rgba(255,255,255,0.1);
      }

      .submit-button:hover {
        background-color: #e5e5e5;
        transform: scale(1.05);
        box-shadow: 0 15px 30px rgba(255,255,255,0.2);
      }

      #results {
        margin: 40px auto;
        max-width: 600px;
        padding: 30px;
        background-color: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 30px;
        font-family: 'Bricolage Grotesque', sans-serif;
        font-size: 1.8em;
        font-weight: 500;
        text-align: center;
        color: #10b981;
        display: none;
        animation: slideUpFade 0.5s ease-out forwards;
      }

      @keyframes slideUpFade {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: #000; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }

      @media (max-width: 768px) {
        body { padding: 15px; }
        h1 { font-size: 1.8rem; margin-bottom: 1.5rem; }
        .question-container { padding: 16px; margin-bottom: 16px; border-radius: 20px; }
        .option-item { padding: 12px 16px; font-size: 0.95rem; }
        .submit-button { margin-top: 20px; font-size: 1.1em; padding: 15px; }
        #results { font-size: 1.4rem; padding: 20px; }
      }
`;

const fontInclude = `
    <!-- ORION Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Bricolage+Grotesque:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
`;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.html')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('materiais');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace existing style block with new ORION overrides
    if (/<style>[\s\S]*?<\/style>/i.test(content)) {
        content = content.replace(/<style>[\s\S]*?<\/style>/i, '<style>\n' + cssOverride + '\n    </style>');
    } else {
        content = content.replace('</head>', '<style>\n' + cssOverride + '\n    </style>\n  </head>');
    }
    
    // Inject fonts if not already present
    if (!content.includes('fonts.googleapis.com')) {
        content = content.replace('</head>', fontInclude + '\n  </head>');
    }
    
    fs.writeFileSync(file, content);
});

console.log('Successfully styled ' + files.length + ' HTML files with ORION Design System.');
