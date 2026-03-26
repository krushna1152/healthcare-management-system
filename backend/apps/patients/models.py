from django.db import models

class PatientRecord(models.Model):
    patient_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10)
    contact_number = models.CharField(max_length=15)
    email = models.EmailField()

class MedicalHistory(models.Model):
    history_id = models.AutoField(primary_key=True)
    patient = models.ForeignKey(PatientRecord, on_delete=models.CASCADE)
    condition = models.CharField(max_length=255)
    date_diagnosed = models.DateField()
    treatments = models.TextField()

class LabResult(models.Model):
    result_id = models.AutoField(primary_key=True)
    patient = models.ForeignKey(PatientRecord, on_delete=models.CASCADE)
    lab_test_name = models.CharField(max_length=255)
    result_date = models.DateField()
    results = models.TextField()

class Prescription(models.Model):
    prescription_id = models.AutoField(primary_key=True)
    patient = models.ForeignKey(PatientRecord, on_delete=models.CASCADE)
    medication_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()