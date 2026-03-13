"""Backend API tests for AI Research Automation Hub"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthAndStats:
    """Stats and health endpoint tests"""

    def test_root(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert "message" in r.json()

    def test_get_stats(self):
        r = requests.get(f"{BASE_URL}/api/research/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total_runs" in data
        assert "completed_runs" in data
        assert "success_rate" in data
        assert "templates_count" in data
        assert "total_results" in data

    def test_stats_types(self):
        r = requests.get(f"{BASE_URL}/api/research/stats")
        data = r.json()
        assert isinstance(data["total_runs"], int)
        assert isinstance(data["success_rate"], (int, float))


class TestResearchRun:
    """Research run endpoint tests"""

    def test_create_research_task(self):
        payload = {
            "config": {
                "platforms": ["Reddit"],
                "niches": ["AI Automation"],
                "depth": "quick",
                "output_format": "json",
                "dataset_size": 5
            },
            "title": "TEST_Research_Task"
        }
        r = requests.post(f"{BASE_URL}/api/research/run", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "task_id" in data
        assert data["status"] == "pending"
        return data["task_id"]

    def test_get_task_by_id(self):
        # First create task
        payload = {
            "config": {"platforms": ["Web"], "niches": ["SaaS"], "depth": "quick", "output_format": "json", "dataset_size": 5},
            "title": "TEST_Get_Task"
        }
        r = requests.post(f"{BASE_URL}/api/research/run", json=payload)
        task_id = r.json()["task_id"]

        # Get task
        r2 = requests.get(f"{BASE_URL}/api/research/{task_id}")
        assert r2.status_code == 200
        task = r2.json()
        assert task["id"] == task_id
        assert task["status"] in ["pending", "running", "completed", "failed"]
        assert "title" in task
        assert "config" in task
        assert "generated_prompt" in task

    def test_get_task_not_found(self):
        r = requests.get(f"{BASE_URL}/api/research/nonexistent-task-id-xyz")
        assert r.status_code == 404

    def test_get_history(self):
        r = requests.get(f"{BASE_URL}/api/research/history")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_delete_task(self):
        # Create a task first
        payload = {
            "config": {"platforms": ["GitHub"], "niches": ["Web Development"], "depth": "quick", "output_format": "json", "dataset_size": 5},
            "title": "TEST_Delete_Task"
        }
        r = requests.post(f"{BASE_URL}/api/research/run", json=payload)
        task_id = r.json()["task_id"]

        # Delete it
        r2 = requests.delete(f"{BASE_URL}/api/research/{task_id}")
        assert r2.status_code == 200

        # Verify deleted
        r3 = requests.get(f"{BASE_URL}/api/research/{task_id}")
        assert r3.status_code == 404


class TestPreviewPrompt:
    """Preview prompt endpoint tests"""

    def test_preview_prompt(self):
        config = {
            "platforms": ["Reddit", "GitHub"],
            "niches": ["AI Automation"],
            "depth": "standard",
            "output_format": "json",
            "dataset_size": 10
        }
        r = requests.post(f"{BASE_URL}/api/research/preview-prompt", json=config)
        assert r.status_code == 200
        data = r.json()
        assert "prompt" in data
        assert len(data["prompt"]) > 50

    def test_preview_prompt_empty(self):
        config = {"platforms": [], "niches": [], "depth": "quick", "output_format": "json", "dataset_size": 5}
        r = requests.post(f"{BASE_URL}/api/research/preview-prompt", json=config)
        assert r.status_code == 200


class TestTemplates:
    """Templates CRUD tests"""

    def test_create_and_get_template(self):
        payload = {
            "name": "TEST_Template",
            "description": "Test template for automated testing",
            "config": {
                "platforms": ["Reddit"],
                "niches": ["SaaS"],
                "depth": "standard",
                "output_format": "json",
                "dataset_size": 10
            }
        }
        r = requests.post(f"{BASE_URL}/api/templates", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "TEST_Template"
        assert "id" in data

        # Verify in list
        r2 = requests.get(f"{BASE_URL}/api/templates")
        assert r2.status_code == 200
        ids = [t["id"] for t in r2.json()]
        assert data["id"] in ids
        return data["id"]

    def test_delete_template(self):
        # Create first
        payload = {
            "name": "TEST_Delete_Template",
            "description": "",
            "config": {"platforms": ["Web"], "niches": ["SEO"], "depth": "quick", "output_format": "json", "dataset_size": 5}
        }
        r = requests.post(f"{BASE_URL}/api/templates", json=payload)
        tmpl_id = r.json()["id"]

        # Delete
        r2 = requests.delete(f"{BASE_URL}/api/templates/{tmpl_id}")
        assert r2.status_code == 200

    def test_get_templates_list(self):
        r = requests.get(f"{BASE_URL}/api/templates")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestExport:
    """Export endpoint tests - needs a completed task"""

    def test_export_no_results_400(self):
        # Create a new task (no results yet)
        payload = {
            "config": {"platforms": ["Web"], "niches": ["Marketing"], "depth": "quick", "output_format": "json", "dataset_size": 5},
            "title": "TEST_Export_Task"
        }
        r = requests.post(f"{BASE_URL}/api/research/run", json=payload)
        task_id = r.json()["task_id"]

        # Poll briefly
        for _ in range(3):
            time.sleep(2)
            status_r = requests.get(f"{BASE_URL}/api/research/{task_id}")
            if status_r.json()["status"] in ["completed", "failed"]:
                break

        # Try export - either works (200) or no results (400)
        r2 = requests.get(f"{BASE_URL}/api/research/{task_id}/export?format=json")
        assert r2.status_code in [200, 400]
