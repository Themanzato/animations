class DrawingApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'pencil';
        this.texts = [];
        this.selectedText = null;
        
        this.initializeCanvas();
        this.addEventListeners();
        this.setupTools();
        this.setupThemeToggle();
        this.setupPostItButton();
    }

    initializeCanvas() {
        // Hacer el canvas responsive
        const resize = () => {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Configuración inicial del contexto
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
    }

    setupTools() {
        // Configurar herramientas
        const tools = document.querySelectorAll('.tool');
        tools.forEach(tool => {
            tool.addEventListener('click', (e) => {
                // Remover clase active de todas las herramientas
                tools.forEach(t => t.classList.remove('active'));
                // Agregar clase active a la herramienta seleccionada
                e.target.closest('.tool').classList.add('active');
                this.currentTool = e.target.closest('.tool').id;
            });
        });

        // Color picker
        const colorPicker = document.getElementById('colorPicker');
        colorPicker.addEventListener('input', (e) => {
            this.ctx.strokeStyle = e.target.value;
        });

        // Stroke width
        const strokeWidth = document.getElementById('strokeWidth');
        strokeWidth.addEventListener('change', (e) => {
            this.ctx.lineWidth = e.target.value;
        });

        // Botón limpiar
        const clearBtn = document.getElementById('clear');
        clearBtn.addEventListener('click', async () => {
            const shouldClear = await this.showModal({
                message: '¿Estás seguro de que quieres limpiar el lienzo?',
                buttons: [
                    { text: 'Sí', type: 'primary', value: true },
                    { text: 'No', value: false }
                ]
            });
            
            if (shouldClear) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                // Eliminar todos los textos y post-its
                this.texts.forEach(text => text.remove());
                this.texts = [];
                document.querySelectorAll('.postit').forEach(postit => postit.remove());
            }
        });

        // Botón guardar
        const saveBtn = document.getElementById('save');
        saveBtn.addEventListener('click', async () => {
            const format = await this.showModal({
                message: '¿En qué formato deseas guardar tu dibujo?',
                buttons: [
                    { text: 'PNG', type: 'primary', value: 'png' },
                    { text: 'JPG', type: 'primary', value: 'jpg' },
                    { text: 'Cancelar', value: false }
                ]
            });
            
            if (format) {
                const link = document.createElement('a');
                link.download = `mi-dibujo.${format}`;
                link.href = this.canvas.toDataURL(`image/${format}`);
                link.click();
            }
        });
    }

    addEventListeners() {
        // Eventos del mouse
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Eventos táctiles
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        
        // Cargar tema guardado
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    setupPostItButton() {
        const toolGroup = document.querySelector('.tool-group');
        const postitBtn = document.createElement('button');
        postitBtn.className = 'tool';
        postitBtn.title = 'Agregar nota adhesiva';
        postitBtn.innerHTML = '<i class="fas fa-sticky-note"></i>';
        postitBtn.onclick = () => this.addPostIt();
        toolGroup.appendChild(postitBtn);
    }

    addPostIt(x = window.innerWidth/2 - 100, y = window.innerHeight/2 - 50) {
        const postit = document.createElement('div');
        postit.className = 'postit';
        postit.style.left = `${x}px`;
        postit.style.top = `${y}px`;
        
        postit.innerHTML = `
            <div class="postit-controls">
                <button class="postit-button" onclick="app.deletePostIt(this.parentElement.parentElement)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <textarea class="postit-content" maxlength="50" placeholder="Escribe tu nota aquí (máx. 50 caracteres)"></textarea>
        `;

        document.body.appendChild(postit);
        this.makeElementDraggable(postit);
    }

    deletePostIt(postit) {
        postit.remove();
    }

    makeElementDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        element.onmousedown = dragMouseDown.bind(this);

        function dragMouseDown(e) {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.tagName === 'I') return;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    showModal(options) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            
            const content = document.createElement('div');
            content.className = 'modal-content';
            
            if (options.type === 'text') {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'modal-input';
                input.placeholder = options.placeholder || 'Ingresa texto';
                content.appendChild(input);

                const fontSizeInput = document.createElement('input');
                fontSizeInput.type = 'number';
                fontSizeInput.className = 'modal-input';
                fontSizeInput.placeholder = 'Tamaño de fuente';
                fontSizeInput.value = '20';
                content.appendChild(fontSizeInput);
            } else {
                content.innerHTML = `<p>${options.message}</p>`;
            }
            
            const buttons = document.createElement('div');
            buttons.className = 'modal-buttons';
            
            options.buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = `modal-button ${button.type || 'secondary'}`;
                btn.textContent = button.text;
                btn.onclick = () => {
                    const result = options.type === 'text' ? {
                        text: content.querySelector('input[type="text"]').value,
                        fontSize: content.querySelector('input[type="number"]').value
                    } : button.value;
                    
                    document.body.removeChild(overlay);
                    document.body.removeChild(modal);
                    resolve(result);
                };
                buttons.appendChild(btn);
            });
            
            modal.appendChild(content);
            modal.appendChild(buttons);
            document.body.appendChild(overlay);
            document.body.appendChild(modal);
            
            overlay.style.display = 'block';
            modal.style.display = 'block';
            
            if (options.type === 'text') {
                content.querySelector('input[type="text"]').focus();
            }
        });
    }

    async startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);

        if (this.currentTool === 'text') {
            const result = await this.showModal({
                type: 'text',
                placeholder: 'Ingresa el texto',
                buttons: [
                    { text: 'Aceptar', type: 'primary', value: true },
                    { text: 'Cancelar', value: false }
                ]
            });
            
            if (result && result.text) {
                this.addTextElement(result.text, x, y, result.fontSize);
            }
        }
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.ctx.lineWidth * 2;
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
        }

        if (this.currentTool !== 'text') {
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
    }

    stopDrawing() {
        this.isDrawing = false;
        this.ctx.closePath();
    }

    addTextElement(text, x, y, fontSize) {
        const textDiv = document.createElement('div');
        textDiv.className = 'text-element';
        textDiv.innerHTML = `
            ${text}
            <div class="text-controls">
                <button class="tool" onclick="app.editText(this.parentElement.parentElement)">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="tool" onclick="app.deleteText(this.parentElement.parentElement)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        textDiv.style.left = x + 'px';
        textDiv.style.top = y + 'px';
        textDiv.style.fontSize = fontSize + 'px';
        textDiv.style.color = this.ctx.strokeStyle;

        this.canvas.parentElement.appendChild(textDiv);
        this.makeTextDraggable(textDiv);
        this.texts.push(textDiv);
    }

    makeTextDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        element.onmousedown = dragMouseDown.bind(this);

        function dragMouseDown(e) {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'I') return;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    async editText(textElement) {
        const result = await this.showModal({
            type: 'text',
            placeholder: 'Editar texto',
            buttons: [
                { text: 'Guardar', type: 'primary', value: true },
                { text: 'Cancelar', value: false }
            ]
        });

        if (result && result.text) {
            textElement.childNodes[0].textContent = result.text;
            textElement.style.fontSize = result.fontSize + 'px';
        }
    }

    deleteText(textElement) {
        textElement.remove();
        this.texts = this.texts.filter(t => t !== textElement);
    }
}

// Hacer la instancia de la app accesible globalmente para los eventos del DOM
window.app = new DrawingApp();

// Inicializar la aplicación cuando se carga el documento
document.addEventListener('DOMContentLoaded', () => {
    new DrawingApp();
}); 