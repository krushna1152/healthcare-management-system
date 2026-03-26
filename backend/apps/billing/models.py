from django.db import models

class Invoice(models.Model):
    invoice_number = models.CharField(max_length=100)
    date_issue = models.DateTimeField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

class Payment(models.Model):
    payment_id = models.CharField(max_length=100)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField()

class Receipt(models.Model):
    receipt_number = models.CharField(max_length=100)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE)
    receipt_date = models.DateTimeField()

class ConsultationFee(models.Model):
    consultation_number = models.CharField(max_length=100)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    consultation_date = models.DateTimeField()