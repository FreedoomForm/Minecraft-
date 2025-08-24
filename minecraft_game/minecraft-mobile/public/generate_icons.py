from PIL import Image, ImageDraw, ImageFont
import base64

def create_icon(size, filename):
    # Создаем изображение с зеленым фоном
    img = Image.new('RGB', (size, size), color='#4CAF50')
    draw = ImageDraw.Draw(img)
    
    # Пытаемся найти шрифт, иначе используем стандартный
    try:
        font_size = size // 3
        font = ImageFont.load_default()  # Используем стандартный шрифт PIL
    except:
        font = ImageFont.load_default()
    
    # Рисуем текст "MC" в центре
    text = "MC"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - 10
    
    draw.text((x, y), text, fill='white', font=font)
    
    # Добавляем простую рамку
    draw.rectangle([0, 0, size-1, size-1], outline='#2E7D32', width=3)
    
    # Сохраняем
    img.save(filename, 'PNG')

# Создаем иконки разных размеров
create_icon(192, 'icon-192x192.png')
create_icon(512, 'icon-512x512.png')

# Создаем favicon
favicon = Image.new('RGB', (32, 32), color='#4CAF50')
draw = ImageDraw.Draw(favicon)
draw.text((8, 8), "MC", fill='white', font=ImageFont.load_default())
favicon.save('favicon.ico', 'ICO', sizes=[(32, 32)])

print("Иконки созданы успешно!")
