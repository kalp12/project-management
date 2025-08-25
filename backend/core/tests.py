# from django.test import TestCase, Client
# from django.contrib.auth.models import User

# class AuthTests(TestCase):
#     def setUp(self):
#         self.client = Client()
#         self.user = User.objects.create_user(
#             username="kp121", password="1234"
#         )

#     def test_login_and_me(self):
#         # Login
#         response = self.client.post("/login/", {
#             "username": "kp121",
#             "password": "1234"
#         }, content_type="application/json")
#         self.assertEqual(response.status_code, 200)

#         # Get current user
#         response = self.client.get("/me/")
#         self.assertContains(response, "kp121")

#         # Logout
#         response = self.client.get("/logout/")
#         self.assertEqual(response.json()["success"], True)

#         # After logout, /me should return null
#         response = self.client.get("/me/")
#         self.assertJSONEqual(response.content, {"user": None})

from django.test import TestCase, Client
from django.contrib.auth.models import User
import json

class AuthTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="kp121",
            password="1234"
        )

    def graphql_query(self, query, variables=None):
        body = {"query": query}
        if variables:
            body["variables"] = variables
        return self.client.post(
            "/graphql/",
            data=json.dumps(body),
            content_type="application/json"
        )

    def test_login_and_me(self):
        # 1. Login mutation
        query = """
        mutation Login($username: String!, $password: String!) {
          login(username: $username, password: $password) {
            user {
              id
              username
            }
          }
        }
        """
        response = self.graphql_query(query, {"username": "kp121", "password": "1234"})
        print(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertIn("kp121", response.content.decode())

        # 2. Query `me`
        query = """
        query {
          me {
            username
          }
        }
        """
        response = self.graphql_query(query)
        print(response.content)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("kp121", response.content.decode())

        # 3. Logout mutation
        query = """
        mutation {
          logout {
            success
          }
        }
        """
        response = self.graphql_query(query)
        print(response.content)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("true", response.content.decode())

        # 4. After logout → me should return null
        response = self.graphql_query("""
        query {
          me {
            username
          }
        }
        """)
        print(response.content)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("null", response.content.decode())
