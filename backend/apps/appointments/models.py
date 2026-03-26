from django.db import models

class Appointment(models.Model):
    patient_name = models.CharField(max_length=255)
    doctor_name = models.CharField(max_length=255)
    appointment_date = models.DateTimeField()
    status = models.CharField(max_length=50)  # e.g., scheduled, completed, canceled

    def __str__(self):
        return f'{self.patient_name} - {self.doctor_name} on {self.appointment_date}'

class AppointmentSlot(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)

    def __str__(self):
        return f'Slot for {self.appointment} from {self.start_time} to {self.end_time}'

class AppointmentNotification(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE)
    notification_time = models.DateTimeField()
    message = models.TextField()

    def __str__(self):
        return f'Notification for {self.appointment} - {self.message}'