package icaraballo.comidaconsciente;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(Barras.class);
        super.onCreate(savedInstanceState);
    }

    /**
     * Las franjas de arriba (hora, batería) y de abajo (gestos) las pinta Android, no la web.
     * La app las pone del color de su fondo cada vez que cambia el tema claro / oscuro (v0.13):
     * Capacitor.Plugins.Barras.poner({ fondo: '#141A17', oscuro: true }).
     */
    @CapacitorPlugin(name = "Barras")
    public static class Barras extends Plugin {
        @PluginMethod
        public void poner(PluginCall call) {
            final String fondo = call.getString("fondo", "#F3F5EB");
            final boolean oscuro = Boolean.TRUE.equals(call.getBoolean("oscuro", false));
            getActivity().runOnUiThread(() -> {
                try {
                    int color = Color.parseColor(fondo);
                    Window w = getActivity().getWindow();
                    w.setBackgroundDrawable(new ColorDrawable(color));
                    w.getDecorView().setBackgroundColor(color);
                    w.setStatusBarColor(color);
                    w.setNavigationBarColor(color);
                    WindowInsetsControllerCompat iconos = WindowCompat.getInsetsController(w, w.getDecorView());
                    iconos.setAppearanceLightStatusBars(!oscuro);
                    iconos.setAppearanceLightNavigationBars(!oscuro);
                    call.resolve();
                } catch (Exception e) {
                    call.reject("No se pudo pintar las barras: " + e.getMessage());
                }
            });
        }
    }
}
