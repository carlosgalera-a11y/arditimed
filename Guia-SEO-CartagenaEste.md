# Guía SEO: Hacer que carlosgalera-a11y.github.io/Cartagenaeste aparezca en Google

## El problema

Google NO conoce tu nuevo sitio en Netlify todavía. Necesitas **decirle a Google que existes** y optimizar tu contenido para las búsquedas "area 2 cartagena" y "cartagenaeste".

---

## PASO 1: Registrar tu sitio en Google Search Console (IMPRESCINDIBLE)

Este es el paso más importante. Sin esto, Google puede tardar semanas o meses en encontrarte.

1. Ve a **[search.google.com/search-console](https://search.google.com/search-console)**
2. Inicia sesión con tu cuenta de Google
3. Clic en **"Añadir propiedad"**
4. Selecciona **"Prefijo de URL"**
5. Escribe: `https://carlosgalera-a11y.github.io/Cartagenaeste`
6. **Verificación**: Ya tienes el archivo `google641ba37ea08a8dcb.html` en tu sitio, así que debería verificarse automáticamente. Si no, usa el método de "Etiqueta HTML" (ya tienes el meta tag `google-site-verification` en tu HTML).

### Después de verificar:

7. Ve a **"Sitemaps"** en el menú izquierdo
8. Escribe `sitemap.xml` y pulsa **"Enviar"**
9. Ve a **"Inspección de URLs"** → pega `https://carlosgalera-a11y.github.io/Cartagenaeste/notebook-local.html` → pulsa **"Solicitar indexación"**
10. Repite con `https://carlosgalera-a11y.github.io/Cartagenaeste/` (la raíz)

> ⏱️ Después de hacer esto, Google suele indexar en **24-72 horas**.

---

## PASO 2: Ampliar el sitemap.xml

Tu sitemap actual solo tiene 4 URLs. Debes incluir TODAS las páginas públicas. Sube este `sitemap.xml` actualizado a tu repositorio:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/notebook-local.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/protocolos-atencion.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/vacunas.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/dietas.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/ejercicios.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/dejar-fumar.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/recursos-sociales.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/violencia-genero.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/enlaces-interes.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/dentista.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/podcast.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/descargar.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>https://carlosgalera-a11y.github.io/Cartagenaeste/privacidad.html</loc>
        <lastmod>2026-02-25</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
    </url>
</urlset>
```

---

## PASO 3: Conectar tu dominio cartagenaeste.es (RECOMENDADO)

Si `cartagenaeste.es` ya apunta al blog de WordPress y tiene historial en Google, puedes hacer que **también** apunte a Netlify:

**Opción A** — Redirigir todo a Netlify:
1. En Netlify → Site settings → Domain management → Add custom domain → `cartagenaeste.es`
2. En tu registrador de dominios, apunta los DNS a Netlify (te dará las instrucciones exactas)

**Opción B** — Mantener WordPress + subdominio para la webapp:
1. Crea un subdominio `app.cartagenaeste.es`
2. Apúntalo a Netlify con un CNAME
3. Así tendrías `cartagenaeste.es` (blog) y `app.cartagenaeste.es` (webapp)

> Un dominio propio `.es` posiciona MUCHO mejor que `.netlify.app` en búsquedas españolas.

---

## PASO 4: Trucos extra para posicionar más rápido

### Crear backlinks (enlaces desde otros sitios)
- Pide a compañeros del SMS, hospital o docencia que enlacen tu web desde sus páginas
- Si tienes redes sociales del centro, comparte el enlace
- Publica en foros de medicina o grupos de residentes con el link

### Mantener el blog activo en cartagenaeste.es
- Si mantienes WordPress activo, publica un artículo enlazando a la webapp
- Ejemplo: "Ya disponible nuestra webapp con 77 protocolos de urgencias: [enlace a Netlify]"

### Google My Business (opcional pero potente)
- Si el Centro de Salud tiene ficha en Google Maps, añade la URL de la webapp como sitio web

---

## Resumen de acciones (por orden de prioridad)

| Acción | Tiempo | Impacto |
|--------|--------|---------|
| 1. Registrar en Google Search Console | 10 min | ⭐⭐⭐⭐⭐ |
| 2. Enviar sitemap.xml | 2 min | ⭐⭐⭐⭐ |
| 3. Solicitar indexación de URLs | 5 min | ⭐⭐⭐⭐ |
| 4. Conectar dominio cartagenaeste.es | 20 min | ⭐⭐⭐⭐⭐ |
| 5. Publicar enlace en redes/blog | 10 min | ⭐⭐⭐ |
| 6. Ampliar sitemap con todas las páginas | 5 min | ⭐⭐⭐ |

> 💡 **Lo más importante**: El Paso 1 (Search Console + solicitar indexación). Sin esto, todo lo demás no sirve de nada.
