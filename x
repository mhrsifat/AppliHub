Assign Order

Example Request:

await api.post(`/orders/${orderId}/assign`, {
  employee_id: 12
});

Success Response (200):

{
  "message": "Order assigned",
  "order": {
    "id": 45,
    "assigned_to": 12,
    "status": "pending",
    "customer_name": "John Doe"
  }
}


---

🔵 Unassign Order

Example Request:

await api.post(`/orders/${orderId}/unassign`);

Success Response (200):

{
  "message": "Order unassigned",
  "order": {
    "id": 45,
    "assigned_to": null
  }
}