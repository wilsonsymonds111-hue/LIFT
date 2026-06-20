import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-extrabold text-foreground">Terms & Conditions</h1>
      </div>

      <div className="px-5 pb-10 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <div>
          <h2 className="font-bold text-foreground text-base mb-2">Disclaimer</h2>
          <p>
            This application provides fitness information, workout recommendations, and exercise guidance for educational
            and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">Assumption of Risk</h2>
          <p>
            By using this application, you acknowledge that physical exercise involves inherent risks including but not
            limited to injury, illness, and in rare cases, death. You voluntarily assume all risks associated with any
            exercise program, activity, or advice accessed through this application.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">Medical Clearance</h2>
          <p>
            You should consult with a qualified healthcare professional before beginning any exercise program. Do not
            use this application if you have any pre-existing medical conditions, injuries, or health concerns without
            first obtaining medical clearance from your doctor.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">No Professional Relationship</h2>
          <p>
            Use of this application does not create a trainer-client, doctor-patient, or any other professional
            relationship. The exercises, routines, and guidance provided are generic and may not be suitable for your
            individual needs, fitness level, or health status.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, the developers, owners, and operators of this application shall not
            be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from
            your use of or reliance on this application, including but not limited to personal injury, property damage,
            or loss of data.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">No Guarantees</h2>
          <p>
            We make no guarantees regarding the accuracy, completeness, or effectiveness of any information provided.
            Results vary by individual. Past performance or progress shown is not indicative of future results.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">User Responsibility</h2>
          <p>
            You are solely responsible for ensuring that any exercises you perform are done with proper form, in a safe
            environment, using appropriate equipment, and within your personal capabilities. Stop immediately if you
            experience pain, dizziness, or discomfort.
          </p>
        </div>

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">Acceptance</h2>
          <p>
            By continuing to use this application, you acknowledge that you have read, understood, and agree to these
            terms and conditions. If you do not agree, you should discontinue use of the application immediately.
          </p>
        </div>
      </div>
    </div>
  );
}