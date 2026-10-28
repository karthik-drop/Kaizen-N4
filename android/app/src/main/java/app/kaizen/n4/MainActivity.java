package app.kaizen.n4;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AlertDialog;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                bridge.getWebView().evaluateJavascript(
                    "(function(){if((location.hash===''||location.hash==='#/')&&!window._studyBack&&!document.querySelector('#fc,#quit,#ex'))return 'exit';if(window.kaizenBack)window.kaizenBack();return 'handled';})()",
                    result -> {
                        if ("\"exit\"".equals(result)) {
                            new AlertDialog.Builder(MainActivity.this)
                                .setMessage("Exit Kaizen N4?")
                                .setNegativeButton("Keep studying", null)
                                .setPositiveButton("Exit", (dialog, which) -> finish())
                                .show();
                        }
                    });
            }
        });
    }
}
