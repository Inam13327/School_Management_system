from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from django.http import HttpResponse
from src.api.admin import admin_site

from .settings import MEDIA_ROOT, STATIC_ROOT

schema_view = get_schema_view(
    openapi.Info(
        title="Education API",
        default_version="v1",
        description="API's for React application of Education website",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="support@zaalasociety.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    # permission_classes=(permissions.AllowAny),
)

urlpatterns = [
    path('admin/', admin_site.urls),
    path('', lambda request: HttpResponse('Welcome to the Education API. Go to /swagger/ for API docs.', content_type='text/plain')),
]

urlpatterns += [
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('docs/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    path('api/', include('src.api.urls'), name='api')
]

# MEDIA AND STATIC URLS
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': MEDIA_ROOT}),
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': STATIC_ROOT}),
]
