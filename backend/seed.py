import os
import sys

# Add parent directory to sys.path so app can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User
from app.models.need import Need
from app.models.fundraiser import Fundraiser

def seed_database():
    print("[*] Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"[*] Database already contains {existing_users} users. Cleaning up for clean seed...")
            db.query(Fundraiser).delete()
            db.query(Need).delete()
            db.query(User).delete()
            db.commit()

        print("[*] Creating demo users...")
        default_pwd = hash_password("Volunteer2026!")

        admin = User(
            email="admin@volunteerhub.ua",
            password_hash=default_pwd,
            full_name="Platform Administrator",
            role="admin",
            unit_name=None,
            is_verified=True,
            points=100
        )

        mil_47 = User(
            email="magura47@military.ua",
            password_hash=default_pwd,
            full_name="47th Separate Mechanized Brigade",
            role="military",
            unit_name='47th OMBr "Magura"',
            is_verified=True,
            points=0
        )

        mil_93 = User(
            email="kholodnyiyar93@military.ua",
            password_hash=default_pwd,
            full_name="93rd Mechanized Brigade",
            role="military",
            unit_name='93rd OMBr "Kholodnyi Yar"',
            is_verified=True,
            points=0
        )

        vol_serhiy = User(
            email="serhiy@volunteers.ua",
            password_hash=default_pwd,
            full_name="Serhiy Prytula Fan Club",
            role="volunteer",
            unit_name=None,
            is_verified=True,
            points=280
        )

        vol_oksana = User(
            email="oksana@volunteers.ua",
            password_hash=default_pwd,
            full_name="Oksana Ivanenko",
            role="volunteer",
            unit_name=None,
            is_verified=True,
            points=95
        )

        vol_dmytro = User(
            email="dmytro@volunteers.ua",
            password_hash=default_pwd,
            full_name="Dmytro Boyko",
            role="volunteer",
            unit_name=None,
            is_verified=True,
            points=40
        )

        db.add_all([admin, mil_47, mil_93, vol_serhiy, vol_oksana, vol_dmytro])
        db.commit()
        db.refresh(mil_47)
        db.refresh(mil_93)
        db.refresh(vol_serhiy)
        db.refresh(vol_oksana)
        db.refresh(vol_dmytro)

        print("[*] Creating 4 realistic military needs...")
        need1 = Need(
            military_user_id=mil_47.id,
            title="10 FPV Kamikaze Strike Drones with Thermal Optics",
            description="Night-strike FPV kamikaze drones equipped with RunCam Thermal lenses to intercept enemy mechanized columns on the Pokrovsk axis.",
            category="drones",
            target_amount=220000.0,
            urgency="critical",
            status="open"
        )

        need2 = Need(
            military_user_id=mil_93.id,
            title="Trench Multi-Band EW Jammer Dome (Counter-FPV)",
            description="Portable 5-band electronic warfare jammer to protect assault infantry squads and frontline medevac vehicles from enemy FPV drones.",
            category="ew",
            target_amount=180000.0,
            urgency="critical",
            status="completed"
        )

        need3 = Need(
            military_user_id=mil_47.id,
            title="Mitsubishi L200 4x4 Evacuation Truck Overhaul & Mud Tires",
            description="Urgent complete gearbox overhaul, reinforced all-terrain leaf springs, and 4 specialized mud-terrain tires for casualty evacuation pickup.",
            category="vehicles",
            target_amount=95000.0,
            urgency="medium",
            status="open"
        )

        need4 = Need(
            military_user_id=mil_93.id,
            title="50 Tactical Bleeding Control Kits (CAT Gen-7 + ChitoGauze)",
            description="Refit packages for tactical combat casualty care (TCCC): genuine CAT Gen-7 tourniquets, ChitoGauze PRO hemostatic gauze, and chest seals.",
            category="medicine",
            target_amount=75000.0,
            urgency="critical",
            status="open"
        )

        db.add_all([need1, need2, need3, need4])
        db.commit()
        db.refresh(need1)
        db.refresh(need2)
        db.refresh(need3)
        db.refresh(need4)

        print("[*] Creating linked Friendly Jars (Fundraisers)...")
        # Need 1 Jars (FPV Drones)
        jar1 = Fundraiser(
            need_id=need1.id,
            volunteer_user_id=vol_serhiy.id,
            jar_url="https://send.monobank.ua/jar/3mMaguraFPV",
            goal_amount=100000.0,
            current_amount=100000.0,
            status="verified",
            proof_image_url="https://volunteer-hub-media-andriidv.s3.eu-north-1.amazonaws.com/proofs/sample_fpv_receipt.jpg"
        )
        jar2 = Fundraiser(
            need_id=need1.id,
            volunteer_user_id=vol_oksana.id,
            jar_url="https://send.monobank.ua/jar/7kThermalBirds",
            goal_amount=60000.0,
            current_amount=60000.0,
            status="active",
            proof_image_url=None
        )
        jar3 = Fundraiser(
            need_id=need1.id,
            volunteer_user_id=vol_dmytro.id,
            jar_url="https://send.monobank.ua/jar/2mNightHunters",
            goal_amount=60000.0,
            current_amount=25000.0,
            status="active",
            proof_image_url=None
        )

        # Need 2 Jar (EW Jammer - 100% completed & verified)
        jar4 = Fundraiser(
            need_id=need2.id,
            volunteer_user_id=vol_serhiy.id,
            jar_url="https://send.monobank.ua/jar/9xDomeShield93",
            goal_amount=180000.0,
            current_amount=180000.0,
            status="verified",
            proof_image_url="https://volunteer-hub-media-andriidv.s3.eu-north-1.amazonaws.com/proofs/sample_ew_receipt.jpg"
        )

        # Need 3 Jar (Truck repair)
        jar5 = Fundraiser(
            need_id=need3.id,
            volunteer_user_id=vol_oksana.id,
            jar_url="https://send.monobank.ua/jar/4kMedevacWheels",
            goal_amount=50000.0,
            current_amount=38000.0,
            status="active",
            proof_image_url=None
        )

        # Need 4 Jar (Tactical Medicine)
        jar6 = Fundraiser(
            need_id=need4.id,
            volunteer_user_id=vol_dmytro.id,
            jar_url="https://send.monobank.ua/jar/1aTacticalMeds",
            goal_amount=40000.0,
            current_amount=40000.0,
            status="pending_verification",
            proof_image_url="https://volunteer-hub-media-andriidv.s3.eu-north-1.amazonaws.com/proofs/sample_meds_invoice.jpg"
        )

        db.add_all([jar1, jar2, jar3, jar4, jar5, jar6])
        db.commit()

        print("[+] Seed completed successfully!")
        print("Demo Credentials (all use password: 'Volunteer2026!'):")
        print(" - Admin:      admin@volunteerhub.ua")
        print(" - Military 1: magura47@military.ua (47th OMBr)")
        print(" - Military 2: kholodnyiyar93@military.ua (93rd OMBr)")
        print(" - Volunteer 1: serhiy@volunteers.ua")
        print(" - Volunteer 2: oksana@volunteers.ua")
        print(" - Volunteer 3: dmytro@volunteers.ua")

    except Exception as e:
        db.rollback()
        print(f"[-] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
