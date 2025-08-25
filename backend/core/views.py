# from django.shortcuts import render

# # Create your views here.
# import json
# from django.contrib.auth import authenticate, login, logout
# from django.http import JsonResponse
# from django.views.decorators.csrf import ensure_csrf_cookie
# from django.views.decorators.http import require_POST

# @require_POST
# def login_view(request):
#     data = json.loads(request.body)
#     username = data.get("username")
#     password = data.get("password")
    
#     if username is None or password is None:
#         return JsonResponse({"detail":"Please provide username and password"})
#     user = authenticate(username=username, passowrd=password)
#     if user is None:
#         return JsonResponse({"detail":"invalid credentials"}, status=400)
#     login(request, user)
#     return JsonResponse({"details": "Succesfully logged in!"})

# def logout_view(request):
#     if not request.user.is_authenticated:
#         return JsonResponse({"detail":"You are not logged in!"}, status=400)
#     logout(request)
#     return JsonResponse({"detail":"Succesfully logged out!"})


# @ensure_csrf_cookie
# def session_view(request):
#     if not request.user.is_authenticated:
#         return JsonResponse({"isAuthenticated": False})
#     return JsonResponse({"isAuthenticated": True})

# def whoami_view(request):
#     if not request.user.is_authenticated:
#         return JsonResponse({"isAuthenticated": False})
#     return JsonResponse({"username":request.user.username})

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def login_view(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return JsonResponse({
                "id": user.id,
                "username": user.username,
                "organization": {
                    "id": user.organization.id if user.organization else None,
                    "slug": user.organization.slug if user.organization else None,
                    "name": user.organization.name if user.organization else None,
                }
            })
        return JsonResponse({"error": "Invalid credentials"}, status=400)
    return JsonResponse({"error": "POST required"}, status=405)

def logout_view(request):
    logout(request)
    return JsonResponse({"success": True})

def me_view(request):
    if request.user.is_authenticated:
        u = request.user
        return JsonResponse({
            "id": u.id,
            "username": u.username,
            "organization": {
                "id": u.organization.id if u.organization else None,
                "slug": u.organization.slug if u.organization else None,
                "name": u.organization.name if u.organization else None,
            }
        })
    return JsonResponse({"user": None})
