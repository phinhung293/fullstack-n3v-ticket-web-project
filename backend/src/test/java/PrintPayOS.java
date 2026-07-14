import vn.payos.PayOS;
import java.lang.reflect.Method;

public class PrintPayOS {
    public static void main(String[] args) {
        for (Method m : PayOS.class.getMethods()) {
            System.out.println(m.toString());
        }
    }
}
