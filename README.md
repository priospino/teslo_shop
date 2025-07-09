<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>


# Teslo API

1. Clonar proyecto
2. ```yarn install```
3. Clonar el archivo ```.env.template``` y renombrarlo a ```.env```
4. Cambiar las variables de entorno
5. Levantar la base de datos
```
docker-compose up -d
```

6. Levantar: ```yarn start:dev```

7. (Opcional) Poblar la base de datos con datos de ejemplo (seed):
```
http://localhost:3000/api/seed
```

## 📖 Documentación de la API

### Productos

#### Obtener productos con paginación
```bash
# Obtener todos los productos (paginación por defecto: limit=10, offset=0)
GET /products

# Paginación personalizada
GET /products?limit=5&offset=10

# Con filtros
GET /products?search=tesla&gender=men&size=M&limit=20&offset=0
```

**Parámetros de consulta:**
- `limit` (opcional): Número de productos por página (default: 10)
- `offset` (opcional): Número de productos a saltar (default: 0)
- `search` (opcional): Buscar en título y descripción
- `gender` (opcional): Filtrar por género (men, women, kid, unisex)
- `size` (opcional): Filtrar por talla disponible

**Respuesta:**
```json
{
  "data": [...],
  "total": 100,
  "limit": 10,
  "offset": 0,
  "totalPages": 10,
  "currentPage": 1,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

#### Obtener un producto específico
```bash
# Buscar por ID (UUID)
GET /products/123e4567-e89b-12d3-a456-426614174000

# Buscar por slug (URL amigable)
GET /products/tesla_model_s_shirt
```

**El endpoint acepta:**
- **UUID**: Para búsqueda por ID único
- **Slug**: Para búsqueda por URL amigable (ej: `tesla_model_s_shirt`)

**Respuesta:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Tesla Model S Shirt",
  "price": 29.99,
  "description": "Comfortable Tesla shirt",
  "slug": "tesla_model_s_shirt",
  "stock": 50,
  "sizes": ["S", "M", "L", "XL"],
  "gender": "men"
}
```
