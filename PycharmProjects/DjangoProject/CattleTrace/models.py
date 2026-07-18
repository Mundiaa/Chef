import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

def prefixed_id(prefix):
    return f"{prefix} - {uuid.uuid4().hex[:10].upper()}"

def owner_id():
    return prefixed_id("OWN")
def holding_id():
    return prefixed_id("HLD")
def animal_id():
    return prefixed_id("ANM")
def worker_id():
    return prefixed_id("WRK")
def health_event_id():
    return prefixed_id("HEV")
def movement_id():
    return prefixed_id("MOV")
def transaction_id():
    return prefixed_id("TRX")
def abattoir_id():
    return prefixed_id("ABT")
def slaughter_id():
    return prefixed_id("SLR")

class OwnerType(models.TextChoices):
    INDIVIDUAL = "individual", "Individual"
    COMPANY = "company", "Company"
    COOPERATIVE = "cooperative", "Cooperative"
    GOVERNMENT = "government", "Government"
    OTHER = "other", "Other"

class HoldingType(models.TextChoices):
    FARM = "farm", "Farm"
    MARKET = "market", "Market"
    QUARANTINE = "quarantine", "Quarantine"
    ABATTOIR = "abattoir", "Abattoir"
    OTHER = "other", "Other"

class Species(models.TextChoices):
    CATTLE = "cattle", "Cattle"
    GOAT = "goat", "Goat"
    SHEEP = "sheep", "Sheep"
    OTHER = "other", "Other"
class Sex(models.TextChoices):
    MALE = "male", "Male"
    FEMALE = "female", "Female"
    UNKNOWN = "unknown", "Unknown"

class AgeClass(models.TextChoices):
    CALF = "calf", "Calf"
    WEANER = "weaner", "Weaner"
    YEARLING = "yearling", "Yearling"
    ADULT = "adult", "Adult"

class AnimalStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    SOLD = "sold", "Sold"
    TRANSFERRED = "transferred", "Transferred"
    SLAUGHTERED = "slaughtered", "Slaughtered"
    DEAD = "dead", "Dead"
    LOST = "lost", "Lost"

class EventType(models.TextChoices):
    VACCINATION = "vaccination", "Vaccination"
    TREATMENT = "treatment", "Treatment"
    DISEASE = "disease", "Disease"
    DEATH = "death", "Death"
    INSPECTION = "inspection", "Inspection"
    OTHER = "other", "Other"

class CredentialLevel(models.TextChoices):
    VETERINARY_OFFICER = "veterinary-officer", "Veterinary Officer"
    COMMUNITY = "community", "Community"

class MovementPurpose(models.TextChoices):
    SALE = "sale", "Sales"
    GRAZING = "grazing", "Grazing"
    BREEDING = "breeding", "Breeding"
    SLAUGHTERED = "slaughtered", "Slaughtered"
    TREATMENT = "treatment", "Treatment"
    OTHER = "other", "Other"

class MovementStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    IN_TRANSIT = "in transit", "In Transit"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"

class Payment(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"

class SaleChannel(models.TextChoices):
    DIRECT = "direct", "Direct"
    MARKET = "market", "Market"
    ONLINE = "online", "Online"
    AUCTION = "auction", "Auction"
    OTHER = "other", "Other"

class Owner(models.Model):
    owner_id = models.CharField(max_length=100, primary_key=True, default=owner_id, editable=False, db_column="owner_ID",)
    national_id = models.CharField(max_length=100, unique=True,)
    name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, unique=True)
    county = models.CharField(max_length=255)
    sub_county = models.CharField(max_length=255)
    owner_type = models.CharField(max_length=255, choices=OwnerType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "owner"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.owner_id})"

    def update_contact(self, phone_number=None, county=None, sub_county=None):
        if phone_number:
            self.phone_number = phone_number
        if county:
            self.county = county
        if sub_county:
            self.sub_county = sub_county
        self.save(update_fields=["phone_number", "county", "sub_county"])

    def get_holdings(self):
        return self.holdings.all()

    def get_animals(self):
        return self.animals.all()

class Holding(models.Model):
    holding_id = models.CharField(max_length=100, primary_key=True, default=holding_id, editable=False, db_column="holding_ID",)
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name="holdings", db_column="owner_ID",)
    county = models.CharField(max_length=255, db_column="county")
    sub_county = models.CharField(max_length=255, db_column="sub_county")
    ward = models.CharField(max_length=255, db_column="ward")
    holding_type = models.CharField(max_length=255, choices=HoldingType.choices)
    owner_type = models.CharField(max_length=255, choices=OwnerType.choices)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "holdings"
        ordering = ["county", "sub_county", "ward", holding_id]

    def __str__(self):
        return f"{self.holding_id} - {self.county}, {self.sub_county}, {self.ward}, {self.holding_type}"

    def get_animals(self):
        return self.current_animals.all()

    def get_current_count(self):
        return self.current_animals.count()

class Animal(models.Model):
    animal_id = models.CharField(max_length=100, primary_key=True, default=animal_id, editable=False, db_column="animal_ID",)
    rfid_number = models.CharField(max_length=255, unique=True)
    current_owner = models.ForeignKey(Owner, on_delete=models.PROTECT, related_name="current_animals", db_column="current_owner_ID",)
    current_holding = models.ForeignKey(Holding, on_delete=models.PROTECT, related_name="current_animals", db_column="current_holding_ID",)
    birth_holding = models.ForeignKey(Holding, on_delete=models.PROTECT, related_name="born_animals", db_column="birth_holding_ID",)
    species = models.CharField(max_length=255, choices=Species.choices)
    sex = models.CharField(max_length=255, choices=Sex.choices)
    age_class = models.CharField(max_length=255, choices=AgeClass.choices)
    breed = models.CharField(max_length=255)
    physical_description = models.CharField(max_length=255)
    animal_status = models.CharField(max_length=30, choices=AnimalStatus.choices, default=AnimalStatus.ACTIVE,)
    estimated_weight = models.FloatField()
    photo = models.ImageField(upload_to="animal_photos/", null=True, blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "animals"
        ordering = ["rfid_number"]

    def __str__(self):
        return f"{self.rfid_number} - {self.species}"

    def transfer(self, new_owner, new_holding):
        self.current_owner = new_owner
        self.current_holding = new_holding
        self.animal_status = AnimalStatus.TRANSFERRED
        self.save(update_fields=["current_owner", "current_holding", "animal_status"])

    def report_stolen(self):
        self.animal_status = AnimalStatus.LOST
        self.save(update_fields=["animal_status"])

    def close_lifecycle(self, status=AnimalStatus.SLAUGHTERED):
        self.animal_status = status
        self.save(update_fields=["animal_status"])

    def get_health_history(self):
        return self.health_history.all()

    def get_ownership_history(self):
        return self.ownership_history.all()

class AnimalHealthWorker(models.Model):
    worker_id = models.CharField(max_length=100, primary_key=True, default=worker_id, editable=False, db_column="worker_ID",)
    name = models.CharField(max_length=255)
    dvs_number = models.CharField(max_length=255, unique=True)
    phone_number = models.CharField(max_length=20, unique=True)
    county = models.CharField(max_length=255, db_column="county")
    sub_county = models.CharField(max_length=255, db_column="sub_county")
    worker_type = models.CharField(max_length=60)
    verified = models.BooleanField(default=False)
    assigned = models.CharField(max_length=255)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "animals_health_workers"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.worker_id})"

    def record_health_event(self, **kwargs):
        return HealthEvent.objects.create(recorded_by=self, **kwargs)

    def escalate_to_vet(self, health_event):
        if self.worker_type == CredentialLevel.COMMUNITY:
            health_event.escalated = True
            health_event.save(update_fields=["escalated"])
            return health_event
        health_event.notes = f"{health_event.notes}\nEscalated to vet.".strip()
        health_event.save(update_fields=["escalated"])
        #return None

    def get_event_history(self):
        return self.event_history.all()

class HealthEvent(models.Model):
    event_id = models.CharField(max_length=100, primary_key=True, default=health_event_id, editable=False, db_column="event_ID",)
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name="health_events", db_column="animal_ID",)
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    disease_name = models.CharField(max_length=255, db_column="disease_name",)
    vaccine_name = models.CharField(max_length=255, db_column="vaccine_name",)
    treatment_given = models.CharField(max_length=255, db_column="treatment_given",)
    cause_of_death = models.CharField(max_length=255, blank=True, db_column="cause_of_death",)
    date_of_event = models.DateField()
    recorded_by = models.ForeignKey(AnimalHealthWorker, on_delete=models.PROTECT, related_name="health_events", db_column="recorded_by",)
    credential_level = models.CharField(max_length=30, choices=CredentialLevel.choices)
    notes = models.TextField(blank=True, db_column="notes",)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "health_events"
        ordering = ["date_of_event", "registered_at"]

    def __str__(self):
